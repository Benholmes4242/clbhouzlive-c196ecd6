import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, MapPin, Flame, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { FLAGS } from '@/config/flags';
import { MOCK_FRIEND_COURSES } from './mockFriendCourses';
import { friendsCoursesMockData } from '@/mocks/friendsCoursesMock';
import FriendsSnapshotCard from './friends/FriendsSnapshotCard';
import FriendsHeroCourseCard from './friends/FriendsHeroCourseCard';
import FriendsActivityCard from './friends/FriendsActivityCard';
import CourseRankBadges from './CourseRankBadges';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import type { CourseWithFriends, FriendCourseHit, Top100Membership } from '@/hooks/useFriendsCourses';

// Temporary: toggle to use high-activity mock data for Friends' Courses
const USE_FRIENDS_COURSES_MOCK = false; // flip to false to use real data

type Timeframe = '7d' | '30d' | '90d' | '12m' | 'all';
type CourseFilter = 'all' | 'new' | 'most_played' | 'highest_rated';

const FriendsCoursesPanel: React.FC = () => {
  // All hooks must be called before any conditional returns
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: realData, isLoading } = useFriendsCourses(user?.id);
  
  const sourceData = USE_FRIENDS_COURSES_MOCK ? friendsCoursesMockData : realData;
  const loading = USE_FRIENDS_COURSES_MOCK ? false : isLoading;
  
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [page, setPage] = useState(1);
  const [recentPage, setRecentPage] = useState(0);
  
  const PAGE_SIZE = 5;
  const RECENT_PAGE_SIZE = 8;
  
  // Fetch real course data directly when using mock friends
  const mockCourseNames = useMemo(() => {
    if (!FLAGS.FRIEND_COURSES_MOCK_ENABLED) return [];
    return [...new Set(MOCK_FRIEND_COURSES.recent.map(hit => hit.course_name))];
  }, []);
  
  const { data: realCoursesForMock } = useQuery({
    queryKey: ['real-courses-for-mock', mockCourseNames],
    enabled: FLAGS.FRIEND_COURSES_MOCK_ENABLED && mockCourseNames.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          country,
          sub_country,
          thumbnail_image,
          course_top100_memberships (
            list_id,
            rank,
            top100_lists!inner (
              id,
              slug,
              short_label
            )
          )
        `)
        .in('name', mockCourseNames);
      
      if (error) throw error;
      
      return (data || []).map((course: any) => ({
        course_id: course.id,
        course_name: course.name,
        country: course.country,
        sub_country: course.sub_country,
        thumbnail_url: course.thumbnail_image,
        top100_memberships: (course.course_top100_memberships || []).map((m: any) => ({
          list_id: m.list_id,
          list_slug: m.top100_lists?.slug || '',
          short_label: m.top100_lists?.short_label || '',
          rank: m.rank,
        })),
      }));
    },
    staleTime: 60_000,
  });
  
  type RealCourseData = {
    course_id: string;
    course_name: string;
    country: string | null;
    sub_country: string | null;
    thumbnail_url: string | null;
    top100_memberships: Top100Membership[];
  };
  
  // When mock flag is enabled, use mock friend profiles but real course data
  const data = useMemo(() => {
    if (FLAGS.FRIEND_COURSES_MOCK_ENABLED) {
      // Wait for real course data to load before showing anything
      if (!realCoursesForMock) return null;
      
      // Match courses by name
      const realCoursesByName = new Map<string, RealCourseData>(
        realCoursesForMock.map((c) => [c.course_name.toLowerCase(), c])
      );
      
      // Merge mock friend data with real course data matched by name
      const enrichedRecent = MOCK_FRIEND_COURSES.recent.map(mockHit => {
        const realCourse = realCoursesByName.get(mockHit.course_name.toLowerCase());
        if (realCourse) {
          return {
            ...mockHit,
            course_id: realCourse.course_id,
            thumbnail_url: realCourse.thumbnail_url,
            top100_memberships: realCourse.top100_memberships,
          };
        }
        return mockHit;
      });
      
      // Rebuild courses from enriched recent data
      const courseMap = new Map<string, CourseWithFriends>();
      for (const hit of enrichedRecent) {
        if (!hit.course_id) continue;
        const existing = courseMap.get(hit.course_id);
        if (!existing) {
          courseMap.set(hit.course_id, {
            course_id: hit.course_id,
            course_name: hit.course_name,
            country: hit.course_country,
            sub_country: hit.course_sub_country,
            thumbnail_url: hit.thumbnail_url,
            average_rating: hit.rating,
            top100_memberships: hit.top100_memberships, // Real rankings
            friends: [hit],
            most_recent_play: hit.played_at,
            total_friends_played: 1,
          });
        } else {
          existing.friends.push(hit);
          existing.total_friends_played = existing.friends.length;
        }
      }
      
      return {
        courses: Array.from(courseMap.values()),
        recent: enrichedRecent,
        totalCourses: courseMap.size,
        totalFriendsActive: MOCK_FRIEND_COURSES.totalFriendsActive,
      };
    }
    return realData;
  }, [realData, realCoursesForMock]);

  // Filter data by time range and course type
  const filteredData = useMemo(() => {
    if (!sourceData) return null;
    
    // Use sourceData directly if we're not using the old FLAGS system
    const baseData = USE_FRIENDS_COURSES_MOCK ? sourceData : data;
    if (!baseData) return null;
    
    // Calculate time cutoff
    let cutoff: Date | null = null;
    if (timeframe !== 'all') {
      cutoff = new Date();
      if (timeframe === '7d') {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (timeframe === '30d') {
        cutoff.setDate(cutoff.getDate() - 30);
      } else if (timeframe === '90d') {
        cutoff.setDate(cutoff.getDate() - 90);
      } else if (timeframe === '12m') {
        cutoff.setFullYear(cutoff.getFullYear() - 1);
      }
    }
    
    // Filter by time
    const timeFilteredRecent = cutoff 
      ? baseData.recent.filter(hit => new Date(hit.played_at) >= cutoff)
      : baseData.recent;
    
    // Filter by course type (Top 100 only or other filters)
    const courseTypeFilteredRecent = courseFilter === 'most_played'
      ? timeFilteredRecent
      : courseFilter === 'highest_rated'
      ? timeFilteredRecent.filter(hit => hit.rating != null)
      : courseFilter === 'new'
      ? timeFilteredRecent
      : timeFilteredRecent;
    
    // Group into courses
    const courseMap = new Map<string, CourseWithFriends>();
    for (const hit of courseTypeFilteredRecent) {
      if (!hit.course_id) continue;
      const existing = courseMap.get(hit.course_id);
      if (!existing) {
        courseMap.set(hit.course_id, {
          course_id: hit.course_id,
          course_name: hit.course_name,
          country: hit.course_country,
          sub_country: hit.course_sub_country,
          thumbnail_url: hit.thumbnail_url,
          average_rating: hit.rating || null,
          top100_memberships: hit.top100_memberships,
          friends: [hit],
          most_recent_play: hit.played_at,
          total_friends_played: 1,
        });
      } else {
        existing.friends.push(hit);
        existing.total_friends_played = existing.friends.length;
        if (new Date(hit.played_at) > new Date(existing.most_recent_play)) {
          existing.most_recent_play = hit.played_at;
        }
        const ratings = existing.friends.map(f => f.rating).filter((r): r is number => r != null);
        if (ratings.length > 0) {
          existing.average_rating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }
      }
    }
    
    const filteredCourses = Array.from(courseMap.values()).sort((a, b) => {
      if (b.total_friends_played !== a.total_friends_played) {
        return b.total_friends_played - a.total_friends_played;
      }
      return new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime();
    });
    
    const uniqueFriends = new Set(courseTypeFilteredRecent.map(hit => hit.friend_id));
    
    return {
      courses: filteredCourses,
      recent: courseTypeFilteredRecent,
      totalCourses: filteredCourses.length,
      totalFriendsActive: uniqueFriends.size,
    };
  }, [sourceData, data, timeframe, courseFilter]);

  // Derive lists safely even while loading
  const courses = filteredData?.courses || [];
  const recent = filteredData?.recent || [];
  const totalCourses = filteredData?.totalCourses || 0;
  const totalFriendsActive = filteredData?.totalFriendsActive || 0;

  // Calculate additional aggregations for snapshot card
  const totalRegions = useMemo(() => {
    const regions = new Set(courses.map(c => c.country).filter(Boolean));
    return regions.size;
  }, [courses]);

  const averageRating = useMemo(() => {
    const ratings = courses
      .map(c => c.average_rating)
      .filter((r): r is number => r != null);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [courses]);

  const totalRounds = recent.length;

  // Generate leaderboard data
  const leaderboard = useMemo(() => {
    const friendMap = new Map<string, {
      friendId: string;
      friendName: string;
      avatarUrl: string | null;
      roundCount: number;
      lastPlayedAt: string;
    }>();

    recent.forEach(hit => {
      const existing = friendMap.get(hit.friend_id);
      const name = hit.friend_profile.display_name || hit.friend_profile.username;
      if (!existing) {
        friendMap.set(hit.friend_id, {
          friendId: hit.friend_id,
          friendName: name,
          avatarUrl: hit.friend_profile.profile_photo_url,
          roundCount: 1,
          lastPlayedAt: hit.played_at,
        });
      } else {
        existing.roundCount++;
        if (new Date(hit.played_at) > new Date(existing.lastPlayedAt)) {
          existing.lastPlayedAt = hit.played_at;
        }
      }
    });

    return Array.from(friendMap.values())
      .sort((a, b) => {
        if (b.roundCount !== a.roundCount) return b.roundCount - a.roundCount;
        return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
      });
  }, [recent]);

  // Select hero course based on filter
  const heroCourse = useMemo(() => {
    if (courses.length === 0) return null;
    
    switch (courseFilter) {
      case 'most_played':
        return courses.sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
      case 'highest_rated':
        return courses
          .filter(c => c.average_rating != null)
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))[0] || courses[0];
      case 'new':
        return courses.sort((a, b) => 
          new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime()
        )[0];
      default:
        return courses.sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
    }
  }, [courses, courseFilter]);

  // Hot courses: courses with 2+ friends, sorted by friends then recency
  const hotCourses = useMemo(() => {
    return courses
      .filter(course => course.total_friends_played >= 2)
      .sort((a, b) => {
        if (b.total_friends_played !== a.total_friends_played) {
          return b.total_friends_played - a.total_friends_played;
        }
        return (
          new Date(b.most_recent_play).getTime() -
          new Date(a.most_recent_play).getTime()
        );
      })
      .slice(0, 4);
  }, [courses]);

  const regularCourses = useMemo(() => {
    const hotIds = new Set(hotCourses.map(c => c.course_id));
    const heroId = heroCourse?.course_id;
    return courses.filter(c => !hotIds.has(c.course_id) && c.course_id !== heroId);
  }, [courses, hotCourses, heroCourse]);

  // Paginate main courses list
  const paginatedCourses = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return regularCourses.slice(startIndex, startIndex + PAGE_SIZE);
  }, [regularCourses, page]);

  const totalPages = Math.ceil(regularCourses.length / PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
    setRecentPage(0);
  }, [timeframe, courseFilter]);

  // Sort recent rounds by played_at descending (most recent first)
  const sortedRecent = useMemo(() => {
    return [...recent].sort(
      (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    );
  }, [recent]);

  // Paginate recent rounds
  const totalRecent = sortedRecent.length;
  const totalRecentPages = Math.ceil(totalRecent / RECENT_PAGE_SIZE);
  const visibleRecent = useMemo(() => {
    const startIdx = recentPage * RECENT_PAGE_SIZE;
    return sortedRecent.slice(startIdx, startIdx + RECENT_PAGE_SIZE);
  }, [sortedRecent, recentPage]);

  // Build course index for jump-to-card functionality
  const allFriendsCourses = heroCourse
    ? [heroCourse, ...regularCourses]
    : regularCourses;

  const courseIndexById = useMemo(() => {
    const map = new Map<string, number>();
    allFriendsCourses.forEach((course, idx) => {
      map.set(course.course_id, idx);
    });
    return map;
  }, [allFriendsCourses]);

  // Handle clicking a recent round to jump to its course card
  const handleRecentRoundClick = (hit: FriendCourseHit) => {
    const index = courseIndexById.get(hit.course_id);

    if (index == null) {
      // Fallback – if not in list, navigate to course detail
      navigate(`/courses/${hit.course_id}`);
      return;
    }

    const targetPage = Math.floor(index / PAGE_SIZE) + 1;
    setPage(targetPage);

    // Wait for DOM update, then scroll to and highlight the card
    requestAnimationFrame(() => {
      const cardEl = document.querySelector<HTMLElement>(
        `[data-friends-course-card="${hit.course_id}"]`
      );
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.add('ring-2', 'ring-primary', 'ring-offset-2');

        // Remove highlight after a short delay
        setTimeout(() => {
          cardEl.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 1400);
      }
    });
  };

  // Now conditional returns - no more hooks after this point
  if (!user) return null;

  // Show skeleton only while loading AND before we have any filtered data
  if (loading && !filteredData) {
    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Friends' Courses
            </h2>
            <p className="text-sm text-muted-foreground">
              See where your friends have been playing lately
            </p>
          </div>
        </div>

        {/* simple skeleton cards */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20 rounded-none sm:rounded-xl bg-muted/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state: no courses from friends in this time range

  if (totalCourses === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No friends' courses yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Follow other golfers to see where they've been playing and discover new courses.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate('/golfers')}
          className="w-full max-w-[320px]"
        >
          Find golfers to follow
        </Button>
      </div>
    );
  }

  const formatFriendsList = (friends: FriendCourseHit[], limit = 3) => {
    const names = friends.slice(0, limit).map(f => f.friend_profile.display_name || f.friend_profile.username);
    const remaining = friends.length - limit;
    return remaining > 0 ? `${names.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}` : names.join(', ');
  };

  return (
    <div className="w-full space-y-4 pb-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">See where your friends have been playing lately</p>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Time Range Dropdown */}
          <div className="flex-1">
            <Select value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
              <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Course Filter Dropdown */}
          <div className="flex-1">
            <Select value={courseFilter} onValueChange={(value) => setCourseFilter(value as CourseFilter)}>
              <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All courses</SelectItem>
                <SelectItem value="new">New this period</SelectItem>
                <SelectItem value="most_played">Most played</SelectItem>
                <SelectItem value="highest_rated">Highest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Friends Snapshot Card */}
      <FriendsSnapshotCard
        timeframe={timeframe}
        totalCourses={totalCourses}
        totalRegions={totalRegions}
        averageRating={averageRating}
        totalRounds={totalRounds}
      />

      {/* Hero Course Card */}
      {heroCourse && (
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
          <FriendsHeroCourseCard 
            course={heroCourse} 
            filterType={courseFilter}
          />
        </div>
      )}

      {/* Friends Activity Leaderboard */}
      <FriendsActivityCard 
        leaderboard={leaderboard}
        timeframe={timeframe}
      />

      {hotCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary-accent" />
              <h3 className="text-sm font-semibold">Hot in your network</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-alt text-muted-foreground">
              Courses multiple friends played recently
            </span>
          </div>

          {/* Full width breakout for cards */}
          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="space-y-4">
              {hotCourses.map((course) => (
              <Card key={course.course_id} className="overflow-hidden rounded-none sm:rounded-xl hover:shadow-md transition-all cursor-pointer bg-surface-card border-border/60"
                onClick={() => navigate(`/courses/${course.course_id}`)}>
                {/* Course Image - Taller */}
                {course.thumbnail_url && (
                  <div className="relative w-full aspect-[1.7/1] overflow-hidden">
                    {/* Friend avatar - inward positioning */}
                    <div className="absolute top-3 left-3 z-20">
                      <Squircle width={40} height={40}>
                        <img 
                          src={course.friends[0]?.friend_profile.profile_photo_url || '/placeholder.svg'} 
                          alt={course.friends[0]?.friend_profile.display_name || 'Friend'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </Squircle>
                    </div>
                    
                    <img
                      src={course.thumbnail_url}
                      alt={course.course_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {/* Stronger bottom gradient */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base">{course.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{course.country}{course.sub_country ? `, ${course.sub_country}` : ''}</p>
                    </div>
                    {(() => {
                      const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);
                      return (
                        <CourseRankBadges
                          globalRank={ranks.globalRank}
                          regionalRank={ranks.regionalRank}
                          usaRank={ranks.usaRank}
                          country={course.country || ''}
                          positioning="inline"
                        />
                      );
                    })()}
                  </div>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {course.friends.slice(0, 3).map((friend, idx) => (
                          <div key={friend.friend_id} className="relative" style={{ zIndex: 10 - idx }}>
                            <Squircle width={28} height={28}>
                              <img 
                                src={friend.friend_profile.profile_photo_url || '/placeholder.svg'} 
                                alt={friend.friend_profile.display_name || friend.friend_profile.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </Squircle>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Played by {formatFriendsList(course.friends, 2)}</span>
                    </div>
                    <Badge className="bg-primary-accent/10 text-primary-accent border-primary-accent/20 text-xs">Hot this month</Badge>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regular courses - Paginated list with slide animation */}
      {paginatedCourses.length > 0 && (
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
          <motion.div
            key={page}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-4"
          >
            {paginatedCourses.map((course) => {
              const mostRecentFriend = course.friends[0];
              
              return (
                <Card 
                  key={course.course_id} 
                  data-friends-course-card={course.course_id}
                  className="relative overflow-hidden rounded-none sm:rounded-xl hover:shadow-md transition-all cursor-pointer bg-card border shadow-sm"
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                >
                  {/* Course Image - Taller, Full Width */}
                  {course.thumbnail_url && (
                    <div className="relative w-full aspect-[1.7/1] overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.course_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      {/* Bottom gradient */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                    </div>
                  )}
                  
                  {/* Rank badges (top-right) */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                    {(() => {
                      const ranks = extractRanksFromMemberships(course.top100_memberships, course.country);
                      return (
                        <CourseRankBadges
                          globalRank={ranks.globalRank}
                          regionalRank={ranks.regionalRank}
                          usaRank={ranks.usaRank}
                          country={course.country || ''}
                          positioning="inline"
                        />
                      );
                    })()}
                  </div>
                  
                  {/* Course Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-lg truncate text-foreground">
                        {course.course_name}
                      </h3>

                      {course.average_rating != null && (
                        <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-2 py-[2px] text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                          <span className="mr-1 text-[11px]">★</span>
                          {course.average_rating.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
                    </p>

                    {/* Bottom row: "Played by..." with avatar */}
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Played by{" "}
                        <span className="font-medium text-foreground">
                          {mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username}
                        </span>
                        {course.total_friends_played > 1 && (
                          <span> & {course.total_friends_played - 1} more</span>
                        )}
                        {" "}· {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
                      </p>

                      <Squircle width={32} height={32} className="shrink-0">
                        <img 
                          src={mostRecentFriend.friend_profile.profile_photo_url || '/placeholder.svg'} 
                          alt={mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </Squircle>
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-11 px-6 rounded-lg shadow-[0_4px_10px_rgba(15,23,42,0.08)] disabled:shadow-none"
                >
                  Previous courses
                </Button>

                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-11 px-6 rounded-lg shadow-[0_4px_10px_rgba(15,23,42,0.08)] disabled:shadow-none"
                >
                  Next courses
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, regularCourses.length)} of {regularCourses.length} courses
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent rounds timeline */}
      {sortedRecent.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Your friends' recent rounds</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Rounds played in the last {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : timeframe === '90d' ? '90 days' : timeframe === '12m' ? '12 months' : 'all time'}
            </p>
          </div>
          
          <motion.div
            key={recentPage}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="space-y-0">
              {visibleRecent.map((hit, idx) => (
                <div 
                  key={`${hit.friend_id}-${hit.course_id}-${idx}`}
                  className={`flex items-center gap-3 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    idx !== visibleRecent.length - 1 ? 'border-b border-border' : ''
                  }`}
                  onClick={() => handleRecentRoundClick(hit)}
                >
                  <Squircle width={36} height={36} className="shrink-0">
                    <img 
                      src={hit.friend_profile.profile_photo_url || '/placeholder.svg'} 
                      alt={hit.friend_profile.display_name || hit.friend_profile.username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </Squircle>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block">
                      <span className="font-semibold">{hit.friend_profile.display_name || hit.friend_profile.username}</span> played {hit.course_name}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent rounds pagination */}
          {totalRecentPages > 1 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={recentPage === 0}
                onClick={() => setRecentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg h-9 text-xs shadow-[0_2px_6px_rgba(15,23,42,0.06)] disabled:shadow-none"
              >
                Previous rounds
              </Button>

              <p className="text-xs text-muted-foreground">
                Page {recentPage + 1} of {totalRecentPages}
              </p>

              <Button
                variant="outline"
                disabled={recentPage === totalRecentPages - 1}
                onClick={() => setRecentPage((p) => Math.min(totalRecentPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg h-9 text-xs shadow-[0_2px_6px_rgba(15,23,42,0.06)] disabled:shadow-none"
              >
                Next rounds
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsCoursesPanel;
