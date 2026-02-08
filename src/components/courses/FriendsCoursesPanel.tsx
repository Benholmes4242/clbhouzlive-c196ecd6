import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { type Timeframe } from '@/lib/timeWindow';


import FriendsSnapshotCard from './friends/FriendsSnapshotCard';
import FriendsHeroCourseCard from './friends/FriendsHeroCourseCard';
import FriendsActivityCard from './friends/FriendsActivityCard';
import TrendingInNetworkCard from './friends/TrendingInNetworkCard';
import WeeklyRecapCard from './friends/WeeklyRecapCard';
import FriendsActivityFeed from './friends/FriendsActivityFeed';
import FriendsCoursesSkeleton from './friends/FriendsCoursesSkeleton';
import FriendsCoursesEmpty from './friends/FriendsCoursesEmpty';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';


type CourseFilter = 'all' | 'new' | 'most_played' | 'highest_rated';

const FriendsCoursesPanel: React.FC = () => {
  const { user } = useSupabaseSession();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');

  // Fetch data with timeframe passed to hook (server-side filtering)
  const { data: realData, isLoading: isRealLoading, isError, error } = useFriendsCourses(user?.id, timeframe);
  
  const sourceData = realData;
  const isLoading = isRealLoading;

  // Error handling: log and toast once when error occurs
  useEffect(() => {
    if (isError && error) {
      console.error('[FriendsCoursesPanel] Failed to load friends courses', {
        userId: user?.id,
        timeframe,
        error,
      });
      toast.error("Couldn't load Friends' Courses. Please try again.");
    }
  }, [isError, error, user?.id, timeframe]);

  // Calculate how many of the friends' courses the user has also played (for "You vs Friends" nudge)
  // NOTE: Moved before filteredData memo since 'new' filter depends on this
  const { data: userPlayedCourseIds } = useQuery({
    queryKey: ['user-played-course-ids', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_courses' as any)
        .select('course_id')
        .eq('user_id', user!.id)
        .eq('played', true);
      
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.course_id));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter data by course type only (time filtering now happens server-side)
  const filteredData = useMemo(() => {
    if (!sourceData) return null;
    
    // Filter by course type (Top 100 only or other filters)
    // For 'new' filter, we need to filter out courses the user has already played
    // This is done after grouping since userPlayedCourseIds operates on course_id
    const courseTypeFilteredRecent = courseFilter === 'most_played'
      ? sourceData.recent
      : courseFilter === 'highest_rated'
      ? sourceData.recent.filter(hit => hit.rating != null)
      : sourceData.recent;
    
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
          community_rating: hit.community_rating ?? null,
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
      }
    }
    
    // Apply 'new' filter: only courses the user hasn't played
    let filteredCourses = Array.from(courseMap.values());
    if (courseFilter === 'new' && userPlayedCourseIds) {
      filteredCourses = filteredCourses.filter(c => !userPlayedCourseIds.has(c.course_id));
    }
    
    filteredCourses.sort((a, b) => {
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
  }, [sourceData, courseFilter, userPlayedCourseIds]);

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
      .map(c => c.community_rating)
      .filter((r): r is number => r != null);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [courses]);

  const totalRounds = recent.length;

  const userPlayedCount = useMemo(() => {
    if (!userPlayedCourseIds || courses.length === 0) return 0;
    return courses.filter(c => userPlayedCourseIds.has(c.course_id)).length;
  }, [courses, userPlayedCourseIds]);

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

  // Select hero course based on filter (use spread to avoid mutating original array)
  const heroCourse = useMemo(() => {
    if (courses.length === 0) return null;
    
    switch (courseFilter) {
      case 'most_played':
        return [...courses].sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
      case 'highest_rated':
        return [...courses]
          .filter(c => c.community_rating != null)
          .sort((a, b) => (b.community_rating || 0) - (a.community_rating || 0))[0] || courses[0];
      case 'new':
        return [...courses].sort((a, b) => 
          new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime()
        )[0];
      default:
        return [...courses].sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
    }
  }, [courses, courseFilter]);

  // Trending courses: courses with 2+ friends, sorted by friends then recency (for Trending module)
  const trendingCourses = useMemo(() => {
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
      .slice(0, 3);
  }, [courses]);

  // Create Set of trending course IDs for the feed
  const trendingCourseIds = useMemo(() => {
    return new Set(trendingCourses.map(c => c.course_id));
  }, [trendingCourses]);

  // Handle save course action (want to play)
  const handleSaveCourse = (courseId: string) => {
    toast.success('Course saved to your list!');
    // TODO: Implement actual save to want_to_play list
  };

  // Now conditional returns - no more hooks after this point
  if (!user) return null;

  // Show skeleton only while loading AND before we have any data
  if (isLoading && !filteredData) {
    return <FriendsCoursesSkeleton />;
  }

  // Error state: show empty component with error indication
  if (isError) {
    return <FriendsCoursesEmpty />;
  }

  // Empty state: no courses from friends in this time range
  if (totalCourses === 0) {
    return <FriendsCoursesEmpty />;
  }

  return (
    <div className="w-full pb-6">
      {/* Friends Snapshot Card - top of page */}
      <div className="px-4 pt-4">
        <FriendsSnapshotCard
          timeframe={timeframe}
          totalCourses={totalCourses}
          totalRegions={totalRegions}
          averageRating={averageRating}
          totalRounds={totalRounds}
          userPlayedCount={userPlayedCount}
        />
      </div>
      
      {/* Filter Dropdowns - between snapshot and hero card */}
      <div className="px-4 mt-4 flex items-center gap-3">
        {/* Time Range Dropdown */}
        <div className="flex-1">
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
            <SelectTrigger 
              aria-label="Select time period"
              className={`h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:border-border data-[state=open]:ring-0 active:scale-[0.98] transition-all duration-150 ${
                timeframe !== '30d' 
                  ? 'border-border ring-1 ring-border text-foreground' 
                  : 'border-border'
              }`}
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="all">All time (recent)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Course Filter Dropdown */}
        <div className="flex-1">
          <Select value={courseFilter} onValueChange={(value) => setCourseFilter(value as CourseFilter)}>
            <SelectTrigger 
              aria-label="Filter courses"
              className={`h-11 w-full rounded-sq-sm bg-card justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:border-border data-[state=open]:ring-0 active:scale-[0.98] transition-all duration-150 ${
                courseFilter !== 'all' 
                  ? 'border-border ring-1 ring-border text-foreground' 
                  : 'border-border'
              }`}
            >
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <SelectItem value="all">All courses</SelectItem>
              <SelectItem value="new">New this period</SelectItem>
              <SelectItem value="most_played">Most played</SelectItem>
              <SelectItem value="highest_rated">Highest rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hero Course Card - Most Popular */}
      {heroCourse && (
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0 mt-4">
          <FriendsHeroCourseCard 
            course={heroCourse} 
            filterType={courseFilter}
          />
        </div>
      )}

      {/* Friends Activity Leaderboard */}
      <div className="px-4 mt-6">
        <FriendsActivityCard 
          leaderboard={leaderboard}
          timeframe={timeframe}
        />
      </div>

      {/* 🔥 Trending in your network */}
      {trendingCourses.length > 0 && (
        <div className="px-4 mt-6">
          <TrendingInNetworkCard courses={trendingCourses} />
        </div>
      )}

      {/* Weekly Recap Card - now uses timeframe for consistency */}
      <div className="px-4 mt-6">
        <WeeklyRecapCard
          recent={recent}
          courses={courses}
          timeframe={timeframe}
          leaderboard={leaderboard}
        />
      </div>

      {/* Unified Activity Feed */}
      <div className="px-4 mt-6">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">Network activity</h3>
        </div>
        <FriendsActivityFeed
          recent={recent}
          courses={courses}
          trendingCourseIds={trendingCourseIds}
          userPlayedCourseIds={userPlayedCourseIds}
          onSave={handleSaveCourse}
        />
      </div>
    </div>
  );
};

export default FriendsCoursesPanel;
