import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard, CourseSortType } from '@/hooks/useTop100CourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Star, Loader2 } from 'lucide-react';
import { formatDistanceToNow, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';

// New course components
import { 
  CourseFilters, 
  CoursePodium, 
  CourseRankingRow, 
  type CourseTimeRange 
} from './courses';

const PAGE_SIZE = 20;

export function CoursesLeaderboardView() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<CourseSortType>('highest_rated');
  const [timeRange, setTimeRange] = useState<CourseTimeRange>('all_time');
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  // Fetch course leaderboard data with new parameters
  const { 
    data, 
    isLoading, 
    isFetching,
    hasNextPage, 
    fetchNextPage,
    isFetchingNextPage 
  } = useTop100CourseLeaderboard({
    scope: 'worldwide',
    timeRange,
    sort,
    pageSize: PAGE_SIZE,
  });

  // Flatten pages into single array
  const allCourses = useMemo(() => {
    return data?.pages.flatMap(page => page.entries) || [];
  }, [data]);

  // Compute date filter for circle rounds
  const fromDate = useMemo(() => {
    const now = new Date();
    if (timeRange === 'this_month') return startOfMonth(now);
    if (timeRange === 'this_season') return startOfYear(now); // Fallback
    return null;
  }, [timeRange]);

  // Fetch recent Top 100 rounds by circle (people user follows)
  const { data: circleRecentRounds } = useQuery({
    queryKey: ['circle-recent-top100-rounds', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: followingRows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = (followingRows ?? []).map(r => r.following_id).slice(0, 500);
      if (followingIds.length === 0) return [];
      
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

  // Only show podium for Most Played and Highest Rated (not Trending)
  const showPodium = useMemo(() => {
    const podiumSorts: CourseSortType[] = ['most_played', 'highest_rated'];
    return podiumSorts.includes(sort) && allCourses.length >= 3;
  }, [sort, allCourses.length]);

  const podiumCourses = useMemo(() => {
    if (!showPodium) return [];
    return allCourses.slice(0, 3);
  }, [showPodium, allCourses]);

  const listCourses = useMemo(() => {
    return showPodium ? allCourses.slice(3) : allCourses;
  }, [showPodium, allCourses]);

  const handleCourseClick = useCallback((courseId: string) => {
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  const handleSortChange = useCallback((newSort: CourseSortType) => {
    setSort(newSort);
  }, []);

  const handleTimeRangeChange = useCallback((newTimeRange: CourseTimeRange) => {
    setTimeRange(newTimeRange);
  }, []);

  // Loading skeleton
  if (isLoading && allCourses.length === 0) {
    return (
      <div className="space-y-4 pb-8 animate-fade-in">
        <div className="px-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-slate-100">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-14 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      {/* 1. Recently Played by Your Circle - TOP */}
      {circleRecentRounds && circleRecentRounds.length > 0 && (
        <section className="space-y-3 -mx-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground px-4">
            Recently Played by Your Circle
          </h3>
          <div className="overflow-x-auto pb-2 pl-4">
            <div className="flex gap-3 pr-4">
              {circleRecentRounds.slice(0, 8).map((round: any) => (
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Sort tabs + 3. Time Range tabs */}
      <CourseFilters
        sort={sort}
        onSortChange={handleSortChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      {/* Course Rankings Section */}
      <section className="space-y-4 -mx-4">
        <div className="px-4">
          <h2 className="text-lg font-semibold text-foreground">Course Rankings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sort === 'most_played' && "The world's greatest golf courses by total rounds logged"}
            {sort === 'highest_rated' && "The world's greatest golf courses by community rating"}
            {sort === 'rising' && "The world's greatest golf courses trending lately"}
          </p>
        </div>

        {/* Updating overlay */}
        <div className={isFetching && !isFetchingNextPage ? 'opacity-60' : ''}>
          {/* Podium (conditional) */}
          {showPodium && (
            <CoursePodium 
              courses={podiumCourses.map(c => ({
                course_id: c.course_id,
                course_name: c.course_name,
                country: c.country,
                sub_country: c.sub_country,
                thumbnail_url: c.thumbnail_url,
                avg_rating: c.avg_rating,
                times_played: c.times_played,
                rank_change: c.rank_change,
              }))}
              sort={sort === 'rising' ? 'rising' : sort === 'highest_rated' ? 'highest_rated' : 'most_played'}
              onCourseClick={handleCourseClick}
            />
          )}

          {/* Rankings List */}
          <div className="flex flex-col">
            {listCourses.length === 0 && allCourses.length === 0 && !isLoading ? (
              <div className="py-8">
                <LeaderboardEmptyState type="no-matches" onResetFilters={() => handleSortChange('most_played')} />
              </div>
            ) : (
              listCourses.map((course, index) => (
                <CourseRankingRow
                  key={course.course_id}
                  course={{
                    ...course,
                    unique_players: course.unique_players || course.times_played,
                    rank_change: course.rank_change || 0,
                    is_trending: course.is_trending || false,
                    is_hall_of_fame: course.is_hall_of_fame || false,
                    prestige_tags: course.prestige_tags || [],
                    current_user_played: course.current_user_played || false,
                    current_user_play_count: course.current_user_play_count || 0,
                  }}
                  rank={showPodium ? index + 4 : index + 1}
                  sort={sort}
                  onClick={() => handleCourseClick(course.course_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Load more / End indicator */}
        {allCourses.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-4 pb-6 px-4">
            {hasNextPage ? (
              <Button
                variant="outline"
                size="default"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full max-w-xs gap-2 rounded-sq-sm"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                You've reached the end
              </p>
            )}
            <p className="text-[11px] text-muted-foreground text-center">
              Showing {allCourses.length} courses
            </p>
          </div>
        )}
      </section>

      

      {/* Create Game Sheet */}
      <CreateGameTripSheetV2
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
    </div>
  );
}

export default CoursesLeaderboardView;
