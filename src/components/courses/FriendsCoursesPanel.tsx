import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses } from '@/hooks/useFriendsCourses';
import { toast } from 'sonner';
import { type Timeframe } from '@/lib/timeWindow';
import { CalendarDays } from 'lucide-react';

import NetworkStatsBar from './friends/NetworkStatsBar';
import NetworkChallengePrompt from './friends/NetworkChallengePrompt';
import FriendsHeroCourseCard from './friends/FriendsHeroCourseCard';
import FriendsActivityCard from './friends/FriendsActivityCard';
import FriendsActivityFeed from './friends/FriendsActivityFeed';
import FriendsCoursesSkeleton from './friends/FriendsCoursesSkeleton';
import FriendsCoursesEmpty from './friends/FriendsCoursesEmpty';
import type { CourseWithFriends, FriendCourseHit } from '@/hooks/useFriendsCourses';

const FriendsCoursesPanel: React.FC = () => {
  const { user } = useSupabaseSession();
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');

  const { data: realData, isLoading: isRealLoading, isError, error } = useFriendsCourses(user?.id, timeframe);
  const sourceData = realData;
  const isLoading = isRealLoading;

  useEffect(() => {
    if (isError && error) {
      console.error('[FriendsCoursesPanel] Failed to load friends courses', { userId: user?.id, timeframe, error });
      toast.error("Couldn't load Friends' Courses. Please try again.");
    }
  }, [isError, error, user?.id, timeframe]);

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

  const filteredData = useMemo(() => {
    if (!sourceData) return null;
    const courseMap = new Map<string, CourseWithFriends>();
    for (const hit of sourceData.recent) {
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

    const filteredCourses = Array.from(courseMap.values()).sort((a, b) => {
      if (b.total_friends_played !== a.total_friends_played) return b.total_friends_played - a.total_friends_played;
      return new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime();
    });

    const uniqueFriends = new Set(sourceData.recent.map(hit => hit.friend_id));
    return {
      courses: filteredCourses,
      recent: sourceData.recent,
      totalCourses: filteredCourses.length,
      totalFriendsActive: uniqueFriends.size,
    };
  }, [sourceData]);

  const courses = filteredData?.courses || [];
  const recent = filteredData?.recent || [];
  const totalCourses = filteredData?.totalCourses || 0;

  const averageRating = useMemo(() => {
    const ratings = courses.map(c => c.community_rating).filter((r): r is number => r != null);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [courses]);

  const totalRounds = recent.length;

  const userPlayedCount = useMemo(() => {
    if (!userPlayedCourseIds || courses.length === 0) return 0;
    return courses.filter(c => userPlayedCourseIds.has(c.course_id)).length;
  }, [courses, userPlayedCourseIds]);

  const leaderboard = useMemo(() => {
    const friendMap = new Map<string, {
      friendId: string; friendName: string; avatarUrl: string | null; roundCount: number; lastPlayedAt: string;
    }>();
    recent.forEach(hit => {
      const existing = friendMap.get(hit.friend_id);
      const name = hit.friend_profile.display_name || hit.friend_profile.username;
      if (!existing) {
        friendMap.set(hit.friend_id, {
          friendId: hit.friend_id, friendName: name,
          avatarUrl: hit.friend_profile.profile_photo_url, roundCount: 1, lastPlayedAt: hit.played_at,
        });
      } else {
        existing.roundCount++;
        if (new Date(hit.played_at) > new Date(existing.lastPlayedAt)) existing.lastPlayedAt = hit.played_at;
      }
    });
    return Array.from(friendMap.values()).sort((a, b) => {
      if (b.roundCount !== a.roundCount) return b.roundCount - a.roundCount;
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    });
  }, [recent]);

  const heroCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return [...courses].sort((a, b) => b.total_friends_played - a.total_friends_played)[0];
  }, [courses]);

  const trendingCourseIds = useMemo(() => {
    return new Set(courses.filter(c => c.total_friends_played >= 2).map(c => c.course_id));
  }, [courses]);

  const hasFriends = sourceData?.hasFriends ?? false;

  if (!user) return null;
  if (isLoading && !filteredData) return <FriendsCoursesSkeleton />;

  // Only show onboarding empty state when user genuinely has no friends
  if (!hasFriends && !isLoading) return <FriendsCoursesEmpty />;

  return (
    <div className="w-full pb-6">
      {/* Inline Stats Bar — ALWAYS visible when user has friends */}
      <NetworkStatsBar
        totalRounds={totalRounds}
        totalCourses={totalCourses}
        averageRating={averageRating}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {totalCourses === 0 ? (
        /* Inline "no activity" for this period — user can change filter */
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">No activity in this period</p>
          <p className="text-xs text-muted-foreground mt-1">Try expanding your time range</p>
        </div>
      ) : (
        <>
          {/* Challenge Prompt */}
          <div className="px-4 mt-2">
            <NetworkChallengePrompt
              userPlayedCount={userPlayedCount}
              totalCourses={totalCourses}
            />
          </div>

          {/* Hero Course — cinematic spotlight */}
          {heroCourse && (
            <div className="mt-4">
              <FriendsHeroCourseCard course={heroCourse} filterType="all" />
            </div>
          )}

          {/* Most Active Friends */}
          <div className="px-4 mt-6">
            <FriendsActivityCard leaderboard={leaderboard} timeframe={timeframe} />
          </div>

          {/* Network Activity Feed */}
          <div className="px-4 mt-6">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-foreground">Network Activity</h3>
            </div>
            <FriendsActivityFeed
              recent={recent}
              courses={courses}
              trendingCourseIds={trendingCourseIds}
              userPlayedCourseIds={userPlayedCourseIds}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsCoursesPanel;
