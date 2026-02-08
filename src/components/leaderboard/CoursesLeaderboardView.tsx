import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseLeaderboard, CourseSortType } from '@/hooks/useCourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Star, Loader2, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { cn } from '@/lib/utils';
import { CourseLocationSelector } from '@/components/leaderboards/shared/CourseLocationSelector';

// New course components
import { 
  CourseFilters, 
  CoursePodium, 
  CourseRankingRow, 
  type CourseTimeRange,
  type CourseScope 
} from './courses';

const PAGE_SIZE = 20;

export function CoursesLeaderboardView() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<CourseSortType>('highest_rated');
  const [timeRange, setTimeRange] = useState<CourseTimeRange>('all_time');
  const [scope, setScope] = useState<CourseScope>('global');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(null);
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Clear region/sub-region when scope changes away from 'country'
  useEffect(() => {
    if (scope !== 'country') {
      setSelectedRegion(null);
      setSelectedSubRegion(null);
    }
  }, [scope]);

  // Scroll-to-top FAB listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch course leaderboard data - shows ALL reviewed courses (no Top 100 restriction)
  const { 
    data, 
    isLoading, 
    isFetching,
    hasNextPage, 
    fetchNextPage,
    isFetchingNextPage 
  } = useCourseLeaderboard({
    scope: scope === 'country' ? 'country' : 'worldwide',
    timeRange,
    sort,
    pageSize: PAGE_SIZE,
    region: scope === 'country' ? selectedRegion : null,
    subRegion: scope === 'country' ? selectedSubRegion : null,
  });

  // Flatten pages into single array
  const allCourses = useMemo(() => {
    return data?.pages.flatMap(page => page.entries) || [];
  }, [data]);

  // Fetch recent Top 100 rounds by circle (people user follows)
  // NOTE: Query key does NOT include timeRange - carousel is independent of time filter
  const { data: circleRecentRounds, isLoading: circleLoading } = useQuery({
    queryKey: ['circle-recent-top100-rounds'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: followingRows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = (followingRows ?? []).map(r => r.following_id).slice(0, 500);
      if (followingIds.length === 0) return [];
      
      const { data } = await supabase
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
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null', { foreignTable: 'golf_courses' })
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
            <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-border">
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
    <div className="flex flex-col pb-24 space-y-6">
      {/* 1. Recently Played by Your Circle - TOP */}
      {circleLoading ? (
        <section className="space-y-3 -mx-4">
          <div className="px-4">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-3 overflow-x-auto pl-4 pr-4 scrollbar-hide">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[180px]">
                <Skeleton className="h-[120px] w-full rounded-xl mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : circleRecentRounds && circleRecentRounds.length > 0 ? (
        <section className="space-y-3 -mx-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground px-4">
            Recently Played by Your Circle
          </h3>
          <div className="overflow-x-auto pb-2 px-4 scrollbar-hide">
            <div className="flex gap-3">
              {circleRecentRounds.slice(0, 8).map((round: any) => (
                <button
                  key={round.id}
                  onClick={() => navigate(`/courses/${round.course_id}`)}
                  className="w-40 flex-shrink-0 text-left group active:scale-[0.97] transition-transform"
                >
                  {/* Course Image */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                    {round.golf_courses?.thumbnail_image ? (
                      <img
                        src={round.golf_courses.thumbnail_image}
                        alt={round.golf_courses.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Course Name */}
                  <h4 className="text-sm font-semibold text-foreground truncate leading-tight">
                    {round.golf_courses?.name}
                  </h4>
                  
                  {/* Player Info */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <SquircleAvatar
                      size={18}
                      src={round.user_profiles?.profile_photo_url}
                      alt={round.user_profiles?.display_name}
                      fallback={(round.user_profiles?.display_name?.[0] || '?').toUpperCase()}
                    />
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {round.user_profiles?.display_name}
                    </span>
                  </div>
                  
                  {/* Time and Rating */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(round.created_at), { addSuffix: false })} ago
                    </span>
                    {round.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-[#C1A84C] fill-[#C1A84C]" />
                        <span className={cn('text-xs font-medium', round.rating >= 9.0 ? 'text-amber-500' : 'text-foreground')}>
                          {round.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Scroll Indicator Dots */}
          <div className="flex justify-center gap-1 px-4">
            {circleRecentRounds.slice(0, Math.min(4, circleRecentRounds.length)).map((_: any, index: number) => (
              <div 
                key={index}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  index === 0 ? 'bg-foreground' : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Sort tabs + 3. Time Range tabs + 4. Scope selector */}
      <CourseFilters
        sort={sort}
        onSortChange={handleSortChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        scope={scope}
        onScopeChange={setScope}
      />

      {/* Region/Sub-Region Selector - shown when scope is 'country' */}
      {scope === 'country' && (
        <div className="px-4">
          <CourseLocationSelector 
            selectedRegion={selectedRegion}
            selectedSubRegion={selectedSubRegion}
            onRegionChange={setSelectedRegion}
            onSubRegionChange={setSelectedSubRegion}
          />
        </div>
      )}

      {/* Course Rankings Section */}
      <section className="space-y-4 -mx-4">
        <div className="space-y-1 px-4 pt-2">
          <h2 className="text-lg font-semibold text-foreground">Course Rankings</h2>
          <p className="text-sm text-muted-foreground">
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

      {/* Scroll to Top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          "fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full",
          "bg-foreground/80 text-background backdrop-blur-sm shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out active:scale-[0.95]",
          showScrollTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}

export default CoursesLeaderboardView;
