import React, { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseLeaderboard, CourseSortType } from '@/hooks/useCourseLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Star, RefreshCw, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { cn } from '@/lib/utils';
import { CourseLocationSelector } from '@/components/leaderboards/shared/CourseLocationSelector';
import { useSeasonCalendar } from '@/hooks/championship';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';

// New course components
import { 
  CourseFilters, 
  CoursePodium, 
  CourseRankingRow, 
  type CourseTimeRange,
  type CourseScope 
} from './courses';
import { CourseRegionPills, type QuickRegion } from './courses/CourseRegionPills';
import { BucketListStrip } from './courses/BucketListStrip';
import { CourseSeasonSpotlight } from './courses/CourseSeasonSpotlight';

const PAGE_SIZE = 20;

// ─── Persistence helpers ────────────────────────────────────────────
const STORAGE_KEY_FILTERS = 'courses-leaderboard-filters';
const STORAGE_KEY_SCROLL = 'courses-leaderboard-scroll';

interface SavedFilters {
  sort: CourseSortType;
  timeRange: CourseTimeRange;
  scope: CourseScope;
  region: string | null;
  subRegion: string | null;
}

function readSavedFilters(): SavedFilters | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (!raw) return null;
    return JSON.parse(raw) as SavedFilters;
  } catch {
    return null;
  }
}

// ─── Inline sub-components ──────────────────────────────────────────

const CourseLeaderboardSkeleton = () => (
  <div className="flex flex-col">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-border">
        <Skeleton className="w-6 h-5 rounded" />
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="w-6 h-10" />
      </div>
    ))}
  </div>
);

const InlineRetryCard = ({ onRetry }: { onRetry: () => void }) => (
  <div className="max-w-md mx-auto mt-4 px-4">
    <button
      onClick={onRetry}
      className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-sq-sm bg-card border border-border text-sm text-muted-foreground transition-colors active:scale-[0.98] active:opacity-70"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Couldn't load more courses · Tap to retry
    </button>
  </div>
);

const InitialErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <WifiOff className="w-12 h-12 text-muted-foreground/40 mb-4" />
    <p className="text-foreground font-semibold mb-1">Unable to load course rankings</p>
    <p className="text-sm text-muted-foreground mb-4">Check your connection and try again</p>
    <button
      onClick={onRetry}
      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97] active:opacity-90 transition-all"
    >
      Retry
    </button>
  </div>
);

// ─── Virtualization constants ───────────────────────────────────────
const ROW_HEIGHT = 81;
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;

export function CoursesLeaderboardView() {
  const navigate = useNavigate();

  // Season color derivation
  const { data: seasonCalendar } = useSeasonCalendar();
  const seasonThemeColor = useMemo(() => {
    const currentSeason = seasonCalendar?.find(s => s.is_current);
    if (!currentSeason) return 'hsl(var(--accent-amber))';
    const lower = currentSeason.name.toLowerCase();
    let id: SeasonId = 'major';
    if (lower.includes('pre-season') || lower.includes('preseason')) id = 'preseason';
    else if (lower.includes('summer')) id = 'summer';
    else if (lower.includes('off-season') || lower.includes('offseason')) id = 'offseason';
    return getSeasonConfig(id).themeColor;
  }, [seasonCalendar]);
  // ─── Filter state with persistence ───────────────────────────────
  const [sort, setSort] = useState<CourseSortType>(() => {
    const saved = readSavedFilters();
    return saved?.sort ?? 'highest_rated';
  });
  const [timeRange, setTimeRange] = useState<CourseTimeRange>(() => {
    const saved = readSavedFilters();
    return saved?.timeRange ?? 'all_time';
  });
  const [scope, setScope] = useState<CourseScope>(() => {
    const saved = readSavedFilters();
    return saved?.scope ?? 'global';
  });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.region ?? null;
  });
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.subRegion ?? null;
  });
  const [quickRegion, setQuickRegion] = useState<QuickRegion>('global');
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  const QUICK_REGION_TO_COUNTRY: Record<QuickRegion, string | null> = {
    'global': null,
    'gb-i': 'Britain & Ireland',
    'usa': 'USA',
    'europe': 'Continental Europe',
  };
  const quickRegionCountry = QUICK_REGION_TO_COUNTRY[quickRegion];

  // Scroll position preservation refs for filter changes
  const scrollPositionRef = useRef<number>(0);
  const isFilterChangeRef = useRef<boolean>(false);

  // Infinite scroll refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  // Virtualization state
  const [scrollTop, setScrollTop] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // ─── Filter persistence effect ────────────────────────────────────
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
        sort,
        timeRange,
        scope,
        region: selectedRegion,
        subRegion: selectedSubRegion,
      }));
    } catch { /* ignore */ }
  }, [sort, timeRange, scope, selectedRegion, selectedSubRegion]);

  // Clear region/sub-region when scope changes away from 'country'
  useEffect(() => {
    if (scope !== 'country') {
      setSelectedRegion(null);
      setSelectedSubRegion(null);
    }
  }, [scope]);


  // Fetch course leaderboard data
  const { 
    data, 
    isLoading, 
    isFetching,
    isError,
    hasNextPage, 
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useCourseLeaderboard({
    scope: scope === 'country' ? 'country' : 'worldwide',
    timeRange,
    sort,
    pageSize: PAGE_SIZE,
    region: scope === 'country' ? selectedRegion : null,
    subRegion: scope === 'country' ? selectedSubRegion : null,
  });

  // Flatten pages — memoized for stable reference
  const allCourses = useMemo(() => {
    return data?.pages.flatMap(page => page.entries) ?? [];
  }, [data?.pages]);

  // ─── Infinite scroll via IntersectionObserver ─────────────────────
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // ─── Virtualization scroll tracking ───────────────────────────────
  useEffect(() => {
    if (allCourses.length < VIRTUALIZATION_THRESHOLD) return;

    const handleScroll = () => {
      const rootEl = document.getElementById('root');
      const y = rootEl && rootEl.scrollTop > 0 ? rootEl.scrollTop : window.scrollY;
      setScrollTop(y);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const rootEl = document.getElementById('root');
    rootEl?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      rootEl?.removeEventListener('scroll', handleScroll);
    };
  }, [allCourses.length]);

  // ─── Scroll position save/restore ─────────────────────────────────
  const handleCourseClick = useCallback((courseId: string) => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll, 10);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allCourses.length]);

  // Fetch recent Top 100 rounds by circle
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
    return allCourses;
  }, [allCourses]);

  const handleSortChange = useCallback((newSort: CourseSortType) => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setSort(newSort);
  }, []);

  const handleTimeRangeChange = useCallback((newTimeRange: CourseTimeRange) => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setTimeRange(newTimeRange);
  }, []);

  const handleScopeChange = useCallback((newScope: CourseScope) => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setScope(newScope);
  }, []);

  // Restore scroll position after filter change and re-render
  useLayoutEffect(() => {
    if (isFilterChangeRef.current) {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        requestAnimationFrame(() => {
          rootEl.scrollTop = scrollPositionRef.current;
        });
      }
      isFilterChangeRef.current = false;
    }
  }, [sort, timeRange, scope, allCourses]);

  // ─── Virtualized list rendering ───────────────────────────────────
  const useVirtualization = listCourses.length >= VIRTUALIZATION_THRESHOLD;

  const virtualizedContent = useMemo(() => {
    if (!useVirtualization) return null;

    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);

    const totalHeight = listCourses.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(window.innerHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(listCourses.length, startIndex + visibleCount);

    const visibleEntries = listCourses.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    return { totalHeight, visibleEntries, offsetY, startIndex };
  }, [useVirtualization, listCourses, scrollTop]);

  // Loading skeleton for initial load
  if (isLoading && allCourses.length === 0 && !isError) {
    return (
      <div className="space-y-4 pb-8 animate-fade-in">
        <div className="px-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 px-4 border-b border-border">
              <Skeleton className="w-6 h-5 rounded" />
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
    <div className="flex flex-col" style={{ gap: 20 }}>
      {/* 1. Recently Played by Your Circle - TOP */}
      {circleLoading ? (
        <section className="space-y-3 -mx-5">
          <div className="px-5">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-3 overflow-x-auto pl-4 pr-4 scrollbar-hide">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[170px]">
                <Skeleton className="h-[128px] w-full rounded-2xl mb-2" />
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
        <section className="-mx-5">
          <h3 className="text-xl font-bold text-foreground px-5 mb-3" style={{ letterSpacing: '-0.3px' }}>
            Your Circle's Recent Rounds
          </h3>
          <div className="relative">
            <div className="overflow-x-auto pb-2 px-5 scrollbar-hide">
              <div className="flex gap-4">
                {circleRecentRounds.slice(0, 8).map((round: any) => (
                  <button
                    key={round.id}
                    onClick={() => handleCourseClick(round.course_id)}
                    className="w-[190px] flex-shrink-0 text-left group active:scale-[0.97] transition-transform"
                  >
                    {/* Course Image */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-2">
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
                    
                    {/* Course Name — single line truncated */}
                    <h4 className="font-semibold text-foreground truncate leading-tight" style={{ fontSize: 15 }}>
                      {round.golf_courses?.name}
                    </h4>
                    
                    {/* Row 2: Avatar + Username */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <SquircleAvatar
                        size={20}
                        src={round.user_profiles?.profile_photo_url}
                        alt={round.user_profiles?.display_name}
                        fallback={(round.user_profiles?.display_name?.[0] || '?').toUpperCase()}
                        hideRing
                      />
                      <span className="text-sm text-muted-foreground truncate">
                        {round.user_profiles?.display_name}
                      </span>
                    </div>

                    {/* Row 3: Time ago + Rating */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(round.created_at), { addSuffix: true })}
                      </span>
                      {round.rating && (
                        <>
                          <span className="text-xs text-muted-foreground/40">·</span>
                          <div className="flex items-center">
                            <span className="font-bold" style={{ color: 'hsl(var(--accent-amber))', fontSize: 14 }}>
                              {round.rating.toFixed(1)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Right fade-out hint */}
            <div className="absolute top-0 right-0 bottom-2 w-8 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--background)))' }} />
          </div>
          
          {/* Pill-style pagination dots */}
          <div className="flex justify-center gap-2 mt-3">
            {circleRecentRounds.slice(0, Math.min(4, circleRecentRounds.length)).map((_: any, index: number) => (
              <div 
                key={index}
                className="rounded-full transition-colors"
                style={index === 0 
                   ? { width: 20, height: 6, background: 'hsl(var(--accent-amber))' }
                  : { width: 6, height: 6, background: 'hsl(var(--border))' }
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Sort tabs — single row */}
      <div className="mt-4">
        <CourseFilters
          sort={sort}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Course Rankings Section */}
      <section className="-mx-5">
        <div className="px-5 mb-5">
          <h2 className="text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.3px' }}>Course Rankings</h2>
          <p className="text-base text-muted-foreground mt-0.5">
            {sort === 'most_played' && "The world's greatest courses by rounds played"}
            {sort === 'highest_rated' && "The world's greatest courses by community rating"}
            {sort === 'rising' && "The world's greatest courses trending right now"}
          </p>
        </div>

        {/* Initial error state */}
        {isError && allCourses.length === 0 ? (
          <InitialErrorState onRetry={() => refetch()} />
        ) : (
          <>
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
                  seasonColor={seasonThemeColor}
                  onCourseClick={handleCourseClick}
                />
              )}

              {/* Rankings List */}
              <div ref={listContainerRef} className="flex flex-col relative">
                {listCourses.length === 0 && allCourses.length === 0 && !isLoading ? (
                  <div className="py-8">
                    <LeaderboardEmptyState type="no-matches" onResetFilters={() => handleSortChange('most_played')} />
                  </div>
                ) : useVirtualization && virtualizedContent ? (
                  // Virtualized list for large entry counts
                  <div
                    className="relative"
                    style={{ height: virtualizedContent.totalHeight }}
                  >
                    <div
                      className="absolute inset-x-0"
                      style={{ transform: `translateY(${virtualizedContent.offsetY}px)` }}
                    >
                      {virtualizedContent.visibleEntries.map((course, i) => (
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
                          rank={(virtualizedContent.startIndex + i) + 1}
                          sort={sort}
                          seasonColor={seasonThemeColor}
                          onClick={() => handleCourseClick(course.course_id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // Non-virtualized list
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
                      rank={index + 1}
                      sort={sort}
                      seasonColor={seasonThemeColor}
                      onClick={() => handleCourseClick(course.course_id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Sentinel + loading skeleton for infinite scroll */}
            {hasNextPage && !isError && (
              <div ref={sentinelRef}>
                {isFetchingNextPage && <CourseLeaderboardSkeleton />}
              </div>
            )}

            {/* Inline retry on pagination error */}
            {isError && !isFetchingNextPage && allCourses.length > 0 && (
              <InlineRetryCard onRetry={() => fetchNextPage()} />
            )}

            {/* Loading indicator during retry */}
            {isError && isFetchingNextPage && allCourses.length > 0 && (
              <CourseLeaderboardSkeleton />
            )}
          </>
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
