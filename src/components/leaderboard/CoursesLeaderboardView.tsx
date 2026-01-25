import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { CourseLeaderboardHero } from './CourseLeaderboardHero';
import { CinematicCourseCard } from './CinematicCourseCard';
import { CourseMomentumCallout } from './CourseMomentumCallout';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Star, ChevronRight, Play, TrendingUp, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TimeRangeFilter } from './v2/TimeRangeFilter';
import { LeaderboardTimeRange } from '@/hooks/useTop100Leaderboard';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { useActiveGameCounts } from '@/features/nearby/hooks/useActiveGameCounts';
import { track } from '@/utils/analytics';
import {
  USE_MOCK_COURSE_LEADERBOARD_DATA,
  getMockCoursesPaginated,
  getMockCircleRecentRounds,
  getMockCoursesOnTheMove,
  CourseSortKey,
} from '@/lib/mockCourseLeaderboardData';

type CourseSortOption = 'most_played' | 'highest_rated' | 'rising' | 'friends';

const PAGE_SIZE = 10;
const MAX_COURSES = 100;

const SORT_OPTIONS: { value: CourseSortOption; label: string; icon: React.ElementType }[] = [
  { value: 'most_played', label: 'Most Played', icon: Play },
  { value: 'highest_rated', label: 'Highest Rated', icon: Star },
  { value: 'rising', label: 'Trending', icon: TrendingUp },
  { value: 'friends', label: 'Friends', icon: Users },
];

const TIME_RANGE_SUBTITLES: Record<LeaderboardTimeRange, string> = {
  all_time: "The world's greatest golf courses",
  this_year: "Top courses this year",
  this_month: "Trending this month",
};

export function CoursesLeaderboardView() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<CourseSortOption>('most_played');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('all_time');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dismissedCallout, setDismissedCallout] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // V3: Create Game sheet state for deep-link from leaderboard
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  // Real data hooks (disabled in mock mode)
  const { data, isLoading } = useTop100CourseLeaderboard({
    scope: 'worldwide',
    timeRange,
    pageSize: 200,
  });

  const allCourses = data?.pages.flatMap(page => page.entries) || [];

  // Compute date filter based on timeRange
  const fromDate = useMemo(() => {
    const now = new Date();
    if (timeRange === 'this_month') return startOfMonth(now);
    if (timeRange === 'this_year') return startOfYear(now);
    return null;
  }, [timeRange]);

  // Fetch recent Top 100 rounds by circle (people user follows)
  const { data: circleRecentRounds } = useQuery({
    queryKey: ['circle-recent-top100-rounds', timeRange],
    enabled: !USE_MOCK_COURSE_LEADERBOARD_DATA,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Get people the user follows (their "circle")
      const { data: followingRows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      // Cap at 500 to prevent performance issues with large follow lists
      const followingIds = (followingRows ?? []).map(r => r.following_id).slice(0, 500);
      if (followingIds.length === 0) return [];
      
      // Get ratings from circle members on any Top 100 list (global, regional, or USA)
      let query = supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          created_at,
          course_id,
          user_id,
          golf_courses!inner (
            id,
            name,
            thumbnail_image,
            global_rank,
            regional_rank,
            usa_rank
          ),
          user_profiles!inner (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .in('user_id', followingIds)
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null', { foreignTable: 'golf_courses' });
      
      // Apply time range filter
      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    staleTime: 60_000,
  });

  // Mock data
  const mockData = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return null;
    return getMockCoursesPaginated(sort as CourseSortKey, 1, visibleCount, 'all', MAX_COURSES);
  }, [sort, visibleCount]);

  const mockCircleRounds = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    return getMockCircleRecentRounds().slice(0, 8);
  }, []);

  const mockCoursesOnTheMove = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    return getMockCoursesOnTheMove();
  }, []);

  // Get trending/rising courses (real data)
  const risingCourses = useMemo(() => {
    if (USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    return [...allCourses]
      .filter(c => c.avg_rating && c.avg_rating >= 7.5)
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
      .slice(0, 6);
  }, [allCourses]);

  // Sort and filter courses based on selection (real data)
  const sortedCourses = useMemo(() => {
    if (USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    
    let courses = [...allCourses];
    
    switch (sort) {
      case 'highest_rated':
        return courses.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      case 'rising':
        // Trending: courses with highest rating relative to play count (discovery potential)
        // Prioritize highly-rated courses that haven't been played as much yet
        return courses
          .filter(c => c.avg_rating && c.avg_rating >= 7.0) // Only quality courses
          .sort((a, b) => {
            // Calculate "discovery score" - high rating but lower plays = more trending
            const aScore = (a.avg_rating ?? 0) / Math.log10(Math.max(a.times_played, 10));
            const bScore = (b.avg_rating ?? 0) / Math.log10(Math.max(b.times_played, 10));
            return bScore - aScore;
          });
      case 'friends':
        return courses
          .filter((c) => (c.friends_count ?? 0) > 0)
          .sort((a, b) => (b.friends_count ?? 0) - (a.friends_count ?? 0));
      case 'most_played':
      default:
        return courses.sort((a, b) => b.times_played - a.times_played);
    }
  }, [allCourses, sort]);

  // Data to display
  const cappedCourses = USE_MOCK_COURSE_LEADERBOARD_DATA
    ? mockData?.courses || []
    : sortedCourses.slice(0, MAX_COURSES);
  
  const totalCount = USE_MOCK_COURSE_LEADERBOARD_DATA
    ? mockData?.total || 0
    : Math.min(sortedCourses.length, MAX_COURSES);
  
  const visibleCourses = USE_MOCK_COURSE_LEADERBOARD_DATA
    ? cappedCourses
    : cappedCourses.slice(0, visibleCount);
  
  const hasMore = USE_MOCK_COURSE_LEADERBOARD_DATA
    ? mockData?.hasMore || visibleCount < totalCount
    : visibleCount < totalCount;

  // Transform data to match CinematicCourseCard expected shape
  const displayCourses = USE_MOCK_COURSE_LEADERBOARD_DATA
    ? visibleCourses.map((c: any) => ({
        course_id: c.course_id,
        course_name: c.course_name,
        thumbnail_image: c.hero_image_url,
        country: c.region,
        global_rank: c.global_rank,
        regional_rank: c.regional_rank,
        avg_rating: c.avg_rating,
        times_played: c.plays_count_total,
        ratings_count: c.ratings_count,
        friends_count: c.friends_played_count_30d,
      }))
    : visibleCourses.map((c: any) => ({
        course_id: c.course_id,
        course_name: c.course_name,
        thumbnail_image: c.thumbnail_url, // RPC returns thumbnail_url, card expects thumbnail_image
        country: c.country,
        sub_country: c.sub_country,
        global_rank: c.global_rank,
        regional_rank: c.regional_rank,
        usa_rank: c.usa_rank,
        avg_rating: c.avg_rating,
        times_played: c.times_played,
        ratings_count: c.times_played, // Use times_played as proxy for ratings_count
        friends_count: c.friends_count,
      }));

  // V3: Get course IDs for active game counts
  const courseIds = useMemo(
    () => displayCourses.map((c: any) => c.course_id).filter(Boolean),
    [displayCourses]
  );
  const { data: activeGameCounts = {} } = useActiveGameCounts(courseIds);

  // V3: Handler for "Create game at this course"
  const handleCreateGameAtCourse = useCallback((course: { id: string; name: string; country: string }) => {
    track('course_create_game_click', { course_id: course.id });
    setGamesHubOpen(true);
  }, []);

  // Reset pagination when sort changes
  const handleSortChange = useCallback((newSort: CourseSortOption) => {
    setSort(newSort);
    setVisibleCount(PAGE_SIZE);
    setDismissedCallout(false);
  }, []);

  // Reset pagination when time range changes
  const handleTimeRangeChange = useCallback((newTimeRange: LeaderboardTimeRange) => {
    setTimeRange(newTimeRange);
    setVisibleCount(PAGE_SIZE);
    setDismissedCallout(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    // Small delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, MAX_COURSES));
      setIsLoadingMore(false);
    }, 300);
  }, []);

  // Circle rounds to display
  const circleRoundsToDisplay = USE_MOCK_COURSE_LEADERBOARD_DATA 
    ? mockCircleRounds 
    : circleRecentRounds;

  // Featured course for hero (first ranked course or mock)
  const featuredCourse = useMemo(() => {
    if (USE_MOCK_COURSE_LEADERBOARD_DATA && mockData?.courses?.[0]) {
      const c = mockData.courses[0];
      return {
        id: c.course_id,
        name: c.course_name,
        location: c.region,
        imageUrl: c.hero_image_url || '',
        globalRank: c.global_rank,
        region: 'Global'
      };
    }
    if (allCourses[0]) {
      const c = allCourses[0];
      return {
        id: c.course_id,
        name: c.course_name,
        location: c.country,
        imageUrl: (c as any).thumbnail_url || (c as any).thumbnail_image || '',
        globalRank: c.global_rank ?? undefined,
        region: 'Global'
      };
    }
    return undefined;
  }, [allCourses, mockData]);

  // Enhanced loading skeleton with shimmer
  if (isLoading && !USE_MOCK_COURSE_LEADERBOARD_DATA) {
    return (
      <div className="space-y-6 pb-8 animate-fade-in">
        {/* Hero Skeleton */}
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw]">
          <div className="relative w-full aspect-[16/10] sm:aspect-[2.2/1] overflow-hidden bg-muted">
            <Skeleton className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="rounded-sq-sm border border-border/20 bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3">
                <Skeleton className="h-6 w-32 rounded-sq-pill" />
                <Skeleton className="h-7 w-48 rounded-sq-xs" />
                <Skeleton className="h-4 w-36 rounded-sq-xs" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-sq-xs" />
                  <Skeleton className="h-6 w-20 rounded-sq-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="px-4 space-y-4">
          <div>
            <Skeleton className="h-6 w-40 rounded-sq-xs mb-1" />
            <Skeleton className="h-4 w-56 rounded-sq-xs" />
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-sq-xs" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-sq-sm" />
        </div>

        {/* Course Card Skeletons */}
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border-b border-border/40" style={{ animationDelay: `${i * 50}ms` }}>
              <Skeleton className="w-full aspect-[16/9]" />
              <div className="px-4 py-3.5 space-y-2 bg-card">
                <Skeleton className="h-5 w-3/4 rounded-sq-xs" />
                <Skeleton className="h-4 w-1/2 rounded-sq-xs" />
                <Skeleton className="h-4 w-1/3 rounded-sq-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Recently Played by Your Circle */}
      {circleRoundsToDisplay && circleRoundsToDisplay.length > 0 && (
        <section className="space-y-3 -mx-4">
          <h3 className="text-sm font-semibold text-foreground px-4">
            Recently Played by Your Circle
          </h3>
          <div className="overflow-x-auto pb-2 pl-4">
            <div className="flex gap-3 pr-4">
              {USE_MOCK_COURSE_LEADERBOARD_DATA 
                ? mockCircleRounds.map((round) => (
                    <button
                      key={round.id}
                      onClick={() => navigate(`/courses/${round.course_id}`)}
                      className="w-[180px] flex-shrink-0 rounded-sq-sm border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div className="relative h-20 w-full">
                        <img
                          src={round.course_image_url}
                          alt={round.course_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {round.course_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <SquircleAvatar
                            size={18}
                            src={round.friend_avatar_url}
                            alt={round.friend_name}
                            fallback={(round.friend_name?.[0] || '?').toUpperCase()}
                          />
                          <span className="text-[11px] text-muted-foreground truncate flex-1">
                            {round.friend_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{round.time_ago} ago</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                            {round.rating_given.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                : (circleRecentRounds || []).slice(0, 8).map((round: any) => (
                    <button
                      key={round.id}
                      onClick={() => navigate(`/courses/${round.course_id}`)}
                      className="w-[180px] flex-shrink-0 rounded-sq-sm border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      {round.golf_courses?.thumbnail_image && (
                        <div className="relative h-20 w-full">
                          <img
                            src={round.golf_courses.thumbnail_image}
                            alt={round.golf_courses.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {round.golf_courses?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <SquircleAvatar
                            size={18}
                            src={round.user_profiles?.profile_photo_url}
                            alt={round.user_profiles?.display_name}
                            fallback={(round.user_profiles?.display_name?.[0] || '?').toUpperCase()}
                          />
                          <span className="text-[11px] text-muted-foreground truncate flex-1">
                            {round.user_profiles?.display_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(round.created_at), { addSuffix: false })} ago</span>
                          {round.rating && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                              {round.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* Course Rankings Section */}
      <section className="space-y-4 -mx-4">
        {/* Section Header */}
        <div className="px-4">
          <h2 className="text-lg font-semibold text-foreground">Course Rankings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TIME_RANGE_SUBTITLES[timeRange]}
          </p>
        </div>

        {/* Sort Tabs - Match Championship/Courses/Explore/Handicap style */}
        <div className="px-4" role="tablist" aria-label="Course sort options">
          <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={sort === opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={cn(
                  'flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all',
                  sort === opt.value
                    ? 'm-1 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                    : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="px-4">
          <TimeRangeFilter value={timeRange} onChange={handleTimeRangeChange} />
        </div>

        {/* Momentum Callout (dismissible) */}
        {!dismissedCallout && sort === 'rising' && (
          <CourseMomentumCallout 
            type="rising" 
            onDismiss={() => setDismissedCallout(true)}
          />
        )}

        {/* Course Grid - Full bleed edge to edge */}
        <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] flex flex-col">
          {displayCourses.length === 0 ? (
            <div className="col-span-full py-8">
              {sort === 'friends' ? (
                <LeaderboardEmptyState type="courses-friends-no-friends" />
              ) : sort === 'rising' ? (
                <LeaderboardEmptyState type="courses-trending" />
              ) : sort === 'highest_rated' ? (
                <LeaderboardEmptyState type="courses-highest-rated" />
              ) : sort === 'most_played' ? (
                <LeaderboardEmptyState type="courses-most-played" />
              ) : (
                <LeaderboardEmptyState type="no-matches" onResetFilters={() => handleSortChange('most_played')} />
              )}
            </div>
          ) : (
            displayCourses.map((course: any, idx: number) => (
              <CinematicCourseCard
                key={course.course_id}
                course={course}
                listPosition={idx}
                showFriendsContext={sort === 'friends'}
                activeGamesCount={activeGameCounts[course.course_id] || 0}
                onCreateGame={handleCreateGameAtCourse}
              />
            ))
          )}
        </div>

        {/* Pagination - "Continue the journey" */}
        {displayCourses.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-4 pb-6">
            {hasMore && (
              <Button
                variant="outline"
                size="default"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full max-w-xs gap-2 rounded-sq-sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue the journey
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground text-center tabular-nums">
              Showing 1–{Math.min(visibleCount, totalCount)} of the world's greatest courses
            </p>
          </div>
        )}
      </section>

      {/* V3: Create Game Sheet */}
      <CreateGameTripSheetV2
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
    </div>
  );
}
