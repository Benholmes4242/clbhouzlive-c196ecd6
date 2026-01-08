import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseLeaderboard } from '@/hooks/useTop100CourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardCourseCard } from './LeaderboardCourseCard';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { LeaderboardInsightChip } from './LeaderboardInsightChip';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TrendingUp, TrendingDown, Star, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  USE_MOCK_COURSE_LEADERBOARD_DATA,
  getMockCoursesPaginated,
  getMockCircleRecentRounds,
  getMockCoursesOnTheMove,
  CourseSortKey,
} from '@/lib/mockCourseLeaderboardData';

type CourseSortOption = 'most_played' | 'highest_rated' | 'trending' | 'friends';
type AudienceFilter = 'all' | 'friends';

const PAGE_SIZE = 10;
const MAX_COURSES = 100;

const SORT_OPTIONS: { value: CourseSortOption; label: string }[] = [
  { value: 'most_played', label: 'Most Played' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'trending', label: 'Trending' },
  { value: 'friends', label: 'Friends Playing' },
];

const SORT_SUBTITLES: Record<CourseSortOption, string> = {
  most_played: 'Top 100 courses by play count',
  highest_rated: 'Top 100 courses by community rating',
  trending: 'Courses gaining momentum this month',
  friends: 'Courses your circle is playing most',
};

export function CoursesLeaderboardView() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<CourseSortOption>('most_played');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Real data hooks (disabled in mock mode)
  const { data, isLoading } = useTop100CourseLeaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    pageSize: 200,
  });

  const allCourses = data?.pages.flatMap(page => page.entries) || [];

  // Fetch recent Top 100 rounds by friends (real)
  const { data: friendsRecentRounds } = useQuery({
    queryKey: ['friends-recent-top100-rounds'],
    enabled: !USE_MOCK_COURSE_LEADERBOARD_DATA,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
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
            global_rank
          ),
          user_profiles!inner (
            id,
            display_name,
            profile_photo_url
          )
        `)
        .not('golf_courses.global_rank', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    staleTime: 60_000,
  });

  // Mock data
  const mockData = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return null;
    
    const page = Math.ceil(visibleCount / PAGE_SIZE);
    return getMockCoursesPaginated(sort as CourseSortKey, 1, visibleCount, audienceFilter, MAX_COURSES);
  }, [sort, audienceFilter, visibleCount]);

  const mockCircleRounds = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    return getMockCircleRecentRounds().slice(0, 8);
  }, []);

  const mockCoursesOnTheMove = useMemo(() => {
    if (!USE_MOCK_COURSE_LEADERBOARD_DATA) return [];
    return getMockCoursesOnTheMove();
  }, []);

  // Get trending courses (real data)
  const trendingCourses = useMemo(() => {
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
    
    if (audienceFilter === 'friends') {
      courses = courses.filter(c => (c.friends_count ?? 0) > 0);
    }
    
    switch (sort) {
      case 'highest_rated':
        return courses.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      case 'trending':
        return courses.sort((a, b) => b.times_played - a.times_played);
      case 'friends':
        return courses
          .filter((c) => (c.friends_count ?? 0) > 0)
          .sort((a, b) => (b.friends_count ?? 0) - (a.friends_count ?? 0));
      case 'most_played':
      default:
        return courses.sort((a, b) => b.times_played - a.times_played);
    }
  }, [allCourses, sort, audienceFilter]);

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

  // Transform mock data to match real data shape
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
    : visibleCourses;

  // Reset pagination when sort changes
  const handleSortChange = useCallback((newSort: CourseSortOption) => {
    setSort(newSort);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // Reset pagination when audience filter changes
  const handleAudienceChange = useCallback((newAudience: AudienceFilter) => {
    setAudienceFilter(newAudience);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, MAX_COURSES));
  }, []);

  // Circle rounds to display
  const circleRoundsToDisplay = USE_MOCK_COURSE_LEADERBOARD_DATA 
    ? mockCircleRounds 
    : friendsRecentRounds;

  // Courses on the move to display
  const coursesOnTheMoveToDisplay = USE_MOCK_COURSE_LEADERBOARD_DATA 
    ? mockCoursesOnTheMove 
    : trendingCourses;

  if (isLoading && !USE_MOCK_COURSE_LEADERBOARD_DATA) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-sq-md" />
        <Skeleton className="h-10 w-full rounded-sq-pill" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-sq-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recently Played by Your Circle */}
      {circleRoundsToDisplay && circleRoundsToDisplay.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-2.5">
            Recently Played by Your Circle
          </h3>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              {USE_MOCK_COURSE_LEADERBOARD_DATA 
                ? mockCircleRounds.map((round) => (
                    <button
                      key={round.id}
                      onClick={() => navigate(`/courses/${round.course_id}`)}
                      className="w-[200px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card overflow-hidden shadow-sm hover:bg-muted/20 transition-colors text-left"
                    >
                      <div className="relative h-24 w-full">
                        <img
                          src={round.course_image_url}
                          alt={round.course_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {round.course_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <SquircleAvatar
                            size={20}
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
                            <Star className="h-2.5 w-2.5 text-primary/70" />
                            Gave it {round.rating_given.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                : (friendsRecentRounds || []).slice(0, 8).map((round: any) => (
                    <button
                      key={round.id}
                      onClick={() => navigate(`/courses/${round.course_id}`)}
                      className="w-[200px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card overflow-hidden shadow-sm hover:bg-muted/20 transition-colors text-left"
                    >
                      {round.golf_courses?.thumbnail_image && (
                        <div className="relative h-24 w-full">
                          <img
                            src={round.golf_courses.thumbnail_image}
                            alt={round.golf_courses.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-medium text-foreground truncate">
                          {round.golf_courses?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <SquircleAvatar
                            size={20}
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
                              <Star className="h-2.5 w-2.5 text-primary/70" />
                              Gave it {round.rating.toFixed(1)}
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

      {/* Courses on the Move */}
      {coursesOnTheMoveToDisplay && coursesOnTheMoveToDisplay.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-2.5">
            Courses on the Move
          </h3>
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2.5 min-w-max">
              {USE_MOCK_COURSE_LEADERBOARD_DATA
                ? mockCoursesOnTheMove.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.course_id}`)}
                      className="w-[150px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card p-2.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          course.rating_delta_30d > 0 ? 'bg-emerald-500' : 'bg-red-400'
                        )} />
                        {course.rating_delta_30d > 0 
                          ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                          : <TrendingDown className="h-3 w-3 text-red-400" />
                        }
                        <span className={cn(
                          'text-[10px] font-medium',
                          course.rating_delta_30d > 0 ? 'text-emerald-600' : 'text-red-500'
                        )}>
                          {course.trend_label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2 mb-1">
                        {course.course_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {course.region}
                      </p>
                    </button>
                  ))
                : trendingCourses.map((course) => (
                    <button
                      key={course.course_id}
                      onClick={() => navigate(`/courses/${course.course_id}`)}
                      className="w-[150px] flex-shrink-0 rounded-sq-md border border-border/50 bg-card p-2.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-600">
                          Rating up +{((course.avg_rating ?? 7) - 7).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2 mb-1">
                        {course.course_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {course.country}
                      </p>
                    </button>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* Course Rankings Section */}
      <section className="space-y-3 pt-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 px-2.5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Course Rankings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{SORT_SUBTITLES[sort]}</p>
          </div>
          
          {/* All / Friends toggle */}
          <div className="flex rounded-sq-pill bg-muted/60 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleAudienceChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-sq-pill transition-all',
                audienceFilter === 'all'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleAudienceChange('friends')}
              className={cn(
                'px-2.5 py-1 rounded-sq-pill transition-all',
                audienceFilter === 'friends'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              Friends
            </button>
          </div>
        </div>

        {/* Sort pills */}
        <div className="py-2 -mx-4 px-4">
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <div className="inline-flex rounded-sq-pill bg-muted/60 p-1 text-xs font-medium min-w-max">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSortChange(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-sq-pill transition-all whitespace-nowrap',
                    sort === opt.value
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Chip */}
        <LeaderboardInsightChip variant="courses" />

        {/* Ranked Course List */}
        <div className="-mx-4 sm:mx-0">
          <div className="space-y-4">
            {displayCourses.length === 0 ? (
              <div className="py-2">
                {sort === 'friends' || audienceFilter === 'friends' ? (
                  <LeaderboardEmptyState type="courses-friends-no-friends" />
                ) : sort === 'trending' ? (
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
              <>
                {displayCourses.map((course: any, idx: number) => (
                  <LeaderboardCourseCard
                    key={course.course_id}
                    course={course}
                    listPosition={idx + 1}
                    showFriendsContext={audienceFilter === 'friends' || sort === 'friends'}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Pagination controls */}
        {displayCourses.length > 0 && (
          <div className="flex flex-col items-center gap-2 pt-4 pb-8">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                className="w-full max-w-xs gap-1.5"
              >
                <ChevronDown className="h-4 w-4" />
                Next {Math.min(PAGE_SIZE, totalCount - visibleCount)} courses
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground">
              Showing 1–{Math.min(visibleCount, totalCount)} of {totalCount} courses
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
