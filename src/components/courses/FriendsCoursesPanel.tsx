import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, MapPin, Flame, Video } from 'lucide-react';
import { FLAGS } from '@/config/flags';
import { MOCK_FRIEND_COURSES } from './mockFriendCourses';
import { FriendsCoursesHero } from './friends/FriendsCoursesHero';
import { FriendsActivityLeaderboard } from './friends/FriendsActivityLeaderboard';
import { calculateFriendAchievements } from './friends/achievementUtils';
import CourseRankBadges from './CourseRankBadges';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';

type TimeRange = 'week' | '30' | '90' | 'year' | 'all';
type CourseTypeFilter = 'all' | 'top100';

const FriendsCoursesPanel: React.FC = () => {
  // All hooks must be called before any conditional returns
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: realData, isLoading } = useFriendsCourses(user?.id);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [courseTypeFilter, setCourseTypeFilter] = useState<CourseTypeFilter>('all');
  
  // Use mock data when flag is enabled
  const data = FLAGS.FRIEND_COURSES_MOCK_ENABLED ? MOCK_FRIEND_COURSES : realData;

  // Filter data by time range and course type
  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Calculate time cutoff
    let cutoff: Date | null = null;
    if (timeRange !== 'all') {
      cutoff = new Date();
      if (timeRange === 'week') {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (timeRange === '30') {
        cutoff.setDate(cutoff.getDate() - 30);
      } else if (timeRange === '90') {
        cutoff.setDate(cutoff.getDate() - 90);
      } else if (timeRange === 'year') {
        cutoff.setFullYear(cutoff.getFullYear() - 1);
      }
    }
    
    // Filter by time
    const timeFilteredRecent = cutoff 
      ? data.recent.filter(hit => new Date(hit.played_at) >= cutoff)
      : data.recent;
    
    // Filter by course type (Top 100 only)
    const courseTypeFilteredRecent = courseTypeFilter === 'top100'
      ? timeFilteredRecent.filter(hit => hit.is_top100 || hit.global_rank != null || hit.regional_rank != null || hit.usa_rank != null)
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
          global_rank: hit.global_rank,
          regional_rank: hit.regional_rank,
          usa_rank: hit.usa_rank,
          thumbnail_url: hit.thumbnail_url,
          average_rating: hit.rating || null,
          is_top100: hit.is_top100,
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
  }, [data, timeRange, courseTypeFilter]);

  // Derive lists safely even while loading
  const courses = filteredData?.courses || [];
  const recent = filteredData?.recent || [];
  const totalCourses = filteredData?.totalCourses || 0;
  const totalFriendsActive = filteredData?.totalFriendsActive || 0;

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
    return courses.filter(c => !hotIds.has(c.course_id));
  }, [courses, hotCourses]);

  // Now conditional returns - no more hooks after this point
  if (!user) return null;

  // Show skeleton only while loading AND before we have any filtered data
  if (isLoading && !filteredData) {
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
              className="h-20 rounded-2xl bg-muted/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state: no courses from friends in this time range

  if (totalCourses === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="text-lg">👥</span>
        </div>
        <h3 className="text-base font-semibold mb-1">No friends added yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Follow or add golfers to see where they've been playing.
        </p>
        <button
          type="button"
          onClick={() => navigate('/discover/people')}
          className="inline-flex h-10 items-center rounded-full bg-[#3A3F46] px-5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
        >
          Find golfers to follow
        </button>
      </div>
    );
  }

  const formatFriendsList = (friends: FriendCourseHit[], limit = 3) => {
    const names = friends.slice(0, limit).map(f => f.friend_profile.display_name || f.friend_profile.username);
    const remaining = friends.length - limit;
    return remaining > 0 ? `${names.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}` : names.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Friends' Courses</h2>
          <p className="text-sm text-muted-foreground">See where your friends have been playing lately</p>
        </div>
        
        {/* Two Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Time Range Dropdown */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full h-10 px-3 text-sm bg-surface-alt border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-accent/20"
            >
              <option value="week">This week</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          {/* Course Type Dropdown */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Course type</label>
            <select
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value as CourseTypeFilter)}
              className="w-full h-10 px-3 text-sm bg-surface-alt border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-accent/20"
            >
              <option value="all">All courses</option>
              <option value="top100">Top 100 only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <FriendsCoursesHero courses={regularCourses} timeRange={timeRange} />

      {/* Activity Leaderboard */}
      <FriendsActivityLeaderboard recent={recent} timeRange={timeRange} />

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

          <div className="space-y-3">
            {hotCourses.map((course) => (
              <Card key={course.course_id} className="overflow-hidden hover:shadow-md transition-all cursor-pointer bg-surface-card border-border/60"
                onClick={() => navigate(`/courses/${course.course_id}`)}>
                {/* Course Image */}
                {course.thumbnail_url && (
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.course_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base">{course.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{course.country}{course.sub_country ? `, ${course.sub_country}` : ''}</p>
                    </div>
                    <CourseRankBadges
                      globalRank={course.global_rank}
                      regionalRank={course.regional_rank}
                      usaRank={course.usa_rank}
                      country={course.country || ''}
                      positioning="inline"
                    />
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
      )}

      {regularCourses.length > 0 && (
        <div className="mt-4 space-y-4">
          {regularCourses.map((course) => {
            const mostRecentFriend = course.friends[0];
            // TODO: Replace with real media_count from database
            const hasMedia = false; // course.media_count > 0;
            
            return (
              <Card key={course.course_id} className="relative overflow-hidden rounded-2xl hover:shadow-md transition-all cursor-pointer bg-card border shadow-sm w-full"
                onClick={() => navigate(`/courses/${course.course_id}`)}>
                {/* Course Image */}
                {course.thumbnail_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.course_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                )}
                
                {/* Friend avatar overlay (top-left) */}
                <div className="absolute top-3 left-3 z-10">
                  <Squircle width={40} height={40}>
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
                
                
                {/* Rank badges (top-right) */}
                <div className="absolute top-3 right-3 z-10">
                  <CourseRankBadges
                    globalRank={course.global_rank}
                    regionalRank={course.regional_rank}
                    usaRank={course.usa_rank}
                    country={course.country || ''}
                    positioning="inline"
                  />
                </div>
                
                {/* Course Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-foreground">
                    {course.course_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
                  </p>

                  {/* Bottom row: "Played by..." and optional media CTA */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Played by {mostRecentFriend.friend_profile.display_name || mostRecentFriend.friend_profile.username} · {formatDistanceToNow(new Date(mostRecentFriend.played_at), { addSuffix: true })}
                    </span>

                    {hasMedia && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('TODO: View media for course', course.course_id);
                        }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        View media
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Recent rounds</h3>
            <p className="text-xs text-muted-foreground mt-0.5">A feed of your friends' latest logged courses</p>
          </div>
          <div className="divide-y divide-border/60">
            {recent.slice(0, 15).map((hit, idx) => (
              <div key={`${hit.friend_id}-${hit.course_id}-${idx}`}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-surface-alt/30 -mx-2 px-2 rounded transition-colors"
                onClick={() => navigate(`/courses/${hit.course_id}`)}>
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
                  <p className="text-sm">
                    <span className="font-semibold">{hit.friend_profile.display_name || hit.friend_profile.username}</span> played {hit.course_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(hit.played_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsCoursesPanel;
