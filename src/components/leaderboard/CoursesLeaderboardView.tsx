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
    'row': null,
  };
  const quickRegionCountry = QUICK_REGION_TO_COUNTRY[quickRegion];

  const ROW_EXCLUDE_COUNTRIES = ['Britain & Ireland', 'USA', 'Continental Europe'];

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
    scope: quickRegion === 'global'
      ? (scope === 'country' ? 'country' : 'worldwide')
      : 'worldwide',
    timeRange,
    sort,
    pageSize: PAGE_SIZE,
    region: quickRegion === 'global'
      ? (scope === 'country' ? selectedRegion : null)
      : quickRegion === 'row'
        ? null
        : quickRegionCountry,
    subRegion: quickRegion === 'global'
      ? (scope === 'country' ? selectedSubRegion : null)
      : null,
    excludeCountries: quickRegion === 'row' ? ROW_EXCLUDE_COUNTRIES : null,
  });

  // Flatten pages — memoized for stable reference
  const allCourses = useMemo(() => {
    return data?.pages.flatMap(page => page.entries) ?? [];
  }, [data?.pages]);

  // Fetch user's played count for the active region — independent of pagination
  const { data: userPlayedCount = 0 } = useQuery({
    queryKey: ['courses-tab-played-count', quickRegion],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: ratedData, error } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('is_mock', false);

      if (error || !ratedData) return 0;

      const ratedIds = [...new Set(ratedData.map(r => r.course_id))];
      if (ratedIds.length === 0) return 0;

      const countryFilter: Record<string, string | null> = {
        'global': null,
        'gb-i':   'Britain & Ireland',
        'usa':    'USA',
        'europe': 'Continental Europe',
        'row':    null,
      };

      const country = countryFilter[quickRegion] ?? null;

      if (!country && quickRegion !== 'row') return ratedIds.length;

      let courseQuery = supabase
        .from('golf_courses')
        .select('id')
        .in('id', ratedIds);

      if (country) {
        courseQuery = courseQuery.eq('country', country);
      } else {
        courseQuery = courseQuery
          .neq('country', 'Britain & Ireland')
          .neq('country', 'USA')
          .neq('country', 'Continental Europe');
      }

      const { data: filtered, error: filterError } = await courseQuery;
      if (filterError) return 0;
      return filtered?.length ?? 0;
    },
  });

  // ─── Computed stats for header ────────────────────────────────────
  const userPlayedPct = useMemo(() => {
    const total = allCourses.length > 0 ? allCourses.length : 100;
    return Math.min(99, Math.round((userPlayedCount / total) * 100));
  }, [userPlayedCount, allCourses.length]);

  const clubRankLabel = '—';

  const currentSeasonId = useMemo(() => {
    const current = seasonCalendar?.find(s => s.is_current);
    if (!current) return 'major' as SeasonId;
    const lower = current.name.toLowerCase();
    if (lower.includes('pre')) return 'preseason' as SeasonId;
    if (lower.includes('summer')) return 'summer' as SeasonId;
    if (lower.includes('off')) return 'offseason' as SeasonId;
    return 'major' as SeasonId;
  }, [seasonCalendar]);

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
      <div style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC', minHeight: '100%' }}>
        {/* Dark header skeleton */}
        <div style={{ background: 'linear-gradient(160deg, #1a1a2e, #2d1f3d, #1f1535)', padding: '16px 16px 0' }}>
          <Skeleton className="h-3 w-52 rounded mb-4" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <Skeleton className="h-3 w-24 rounded mb-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <Skeleton className="h-9 w-32 rounded" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton className="h-14 w-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <Skeleton className="h-14 w-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <Skeleton className="h-10 flex-1 rounded-t-[8px]" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <Skeleton className="h-10 flex-1 rounded-t-[8px]" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <Skeleton className="h-10 flex-1 rounded-t-[8px]" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Region pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[60, 56, 52, 60, 80].map((w, i) => <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />)}
          </div>

          {/* Circle rounds */}
          <Skeleton className="h-4 w-48 rounded mb-1" />
          <div style={{ display: 'flex', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[70px] w-[180px] rounded-xl flex-shrink-0" />
            ))}
          </div>

          {/* Season spotlight */}
          <Skeleton className="h-[168px] w-full rounded-2xl" />

          {/* Rankings header */}
          <div>
            <Skeleton className="h-6 w-48 rounded mb-2" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>

          {/* Podium */}
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton className="h-[148px] flex-1 rounded-2xl" />
            <Skeleton className="h-[148px] flex-1 rounded-2xl" />
          </div>

          {/* Row list */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.07)' : 'none',
              }}>
                <Skeleton className="w-6 h-5 rounded" />
                <Skeleton className="w-[60px] h-[44px] rounded-[10px]" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-4 rounded" style={{ width: `${[75, 60, 70, 55, 65][i]}%` }} />
                  <Skeleton className="h-3 rounded" style={{ width: `${[55, 45, 50, 40, 55][i]}%` }} />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── DARK HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #2d1f3d 60%, #1f1535 100%)',
        padding: 'clamp(14px,3vw,18px) clamp(14px,4vw,18px) 0',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Decorative ambient glows */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(247,147,30,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(247,147,30,0.04)', pointerEvents: 'none' }} />

        {/* Season label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'clamp(8px,2vw,12px)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(9px,2.5vw,11px)', fontWeight: 600, fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Course Rankings · {getSeasonConfig(currentSeasonId ?? 'major').title}
          </span>
        </div>

        {/* Stats row with avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(14px,3.5vw,20px)' }}>
          {/* Squircle avatar */}
          {currentUserProfile?.profile_photo_url ? (
            <img
              src={currentUserProfile.profile_photo_url}
              alt=""
              style={{ width: 52, height: 52, borderRadius: '34%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
            />
          ) : currentUserProfile ? (
            <div style={{
              width: 52, height: 52, borderRadius: '34%', background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 700, flexShrink: 0,
            }}>
              {(currentUserProfile.display_name || '?').charAt(0).toUpperCase()}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(14px,3.5vw,20px)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px,2.8vw,12px)', fontWeight: 500, fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: 2 }}>
              You've played
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#F7931E', fontSize: 'clamp(28px,7.5vw,36px)', fontWeight: 800, fontFamily: 'DM Sans, system-ui, sans-serif', lineHeight: 1 }}>
                {userPlayedCount}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(12px,3.2vw,14px)', fontWeight: 500, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                courses
              </span>
            </div>
          </div>

          {/* Stat pills */}
          {[
            { val: `${userPlayedPct}%`, label: 'of list' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 12,
              padding: 'clamp(8px,2vw,10px) clamp(10px,2.5vw,14px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 56,
            }}>
              <span style={{ color: '#fff', fontSize: 'clamp(15px,4vw,19px)', fontWeight: 800, fontFamily: 'DM Sans, system-ui, sans-serif', lineHeight: 1 }}>
                {s.val}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px,2.4vw,11px)', fontWeight: 500, fontFamily: 'DM Sans, system-ui, sans-serif', marginTop: 2 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Sort tabs — flush to bottom */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { id: 'highest_rated', label: 'Highest Rated' },
            { id: 'most_played', label: 'Most Played' },
            { id: 'rising', label: 'Trending' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleSortChange(t.id as CourseSortType)}
              style={{
                flex: 1, padding: 'clamp(8px,2vw,10px) 0', borderRadius: '8px 8px 0 0',
                border: 'none', cursor: 'pointer',
                fontSize: 'clamp(10px,2.8vw,12px)',
                fontWeight: sort === t.id ? 800 : 500,
                fontFamily: 'DM Sans, system-ui, sans-serif',
                background: sort === t.id ? '#F8FAFC' : 'rgba(255,255,255,0.07)',
                color: sort === t.id ? '#0C0C0E' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s',
              }}
              className="active:scale-[0.97] transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIGHT BODY ZONE ── */}
      <div style={{ background: '#F8FAFC', flex: 1, padding: 'clamp(12px,3vw,16px) 0' }}>

        {/* Region pills */}
        <div style={{ padding: '0 clamp(12px,3vw,16px)', marginBottom: 14 }}>
          <CourseRegionPills
            value={quickRegion}
            onChange={(r) => {
              handleScopeChange(r === 'global' || r === 'row' ? 'global' : 'country');
              setQuickRegion(r);
              if (r !== 'global') {
                setSelectedRegion(null);
                setSelectedSubRegion(null);
              }
            }}
          />
        </div>

        {/* Circle Rounds — compact pill format */}
        <div style={{ padding: '0 clamp(12px,3vw,16px)', marginBottom: 14 }}>
          {circleLoading ? (
            <div>
              <Skeleton className="h-4 w-48 rounded mb-3" />
              <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[70px] rounded-xl flex-shrink-0" style={{ width: 180 }} />)}
              </div>
            </div>
          ) : circleRecentRounds && circleRecentRounds.length > 0 ? (
            <div>
              <h3 style={{ fontSize: 'clamp(14px,3.8vw,16px)', fontWeight: 800, color: '#0C0C0E', fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: 10, letterSpacing: '-0.3px' }}>
                Your Circle's Recent Rounds
              </h3>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
                {circleRecentRounds.slice(0, 8).map((round: any) => (
                  <button
                    key={round.id}
                    onClick={() => handleCourseClick(round.course_id)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                      background: '#FFFFFF', borderRadius: 12,
                      padding: '8px 10px',
                      border: '1px solid rgba(0,0,0,0.07)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      cursor: 'pointer', textAlign: 'left',
                      maxWidth: 220,
                    }}
                    className="active:scale-[0.97] transition-all"
                  >
                    {/* Course thumbnail */}
                    {round.golf_courses?.thumbnail_image ? (
                      <img
                        src={round.golf_courses.thumbnail_image}
                        alt={round.golf_courses?.name}
                        style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 9, color: '#9ca3af' }}>No img</span>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0C0C0E', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {round.golf_courses?.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <SquircleAvatar
                          size={14}
                          src={round.user_profiles?.profile_photo_url}
                          alt={round.user_profiles?.display_name}
                          fallback={(round.user_profiles?.display_name?.[0] ?? '?').toUpperCase()}
                          hideRing
                        />
                        <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {round.user_profiles?.display_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                          {formatDistanceToNow(new Date(round.created_at), { addSuffix: true })}
                        </span>
                        {round.rating && (
                          <>
                            <span style={{ fontSize: 10, color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#F7931E', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                              {round.rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Season Spotlight */}
        <div style={{ padding: '0 clamp(12px,3vw,16px)', marginBottom: 14 }}>
          <CourseSeasonSpotlight onCourseClick={handleCourseClick} />
        </div>

        {/* Bucket List Strip */}
        <div style={{ marginBottom: 14 }}>
          <BucketListStrip onCourseClick={handleCourseClick} />
        </div>

        {/* Course Rankings Section */}
        <div style={{ padding: '0 clamp(12px,3vw,16px)' }}>
          {/* Rankings header */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 'clamp(20px,5.5vw,24px)', fontWeight: 800, color: '#0C0C0E', fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: '-0.3px', margin: 0 }}>
              Course Rankings
            </h2>
            <p style={{ fontSize: 'clamp(12px,3.2vw,14px)', color: '#6B7280', fontFamily: 'DM Sans, system-ui, sans-serif', marginTop: 4, margin: 0 }}>
              {sort === 'most_played' && `The world's greatest courses by rounds played${quickRegion === 'row' ? ' — Rest of World' : quickRegion !== 'global' ? ` in ${QUICK_REGION_TO_COUNTRY[quickRegion]}` : ''}`}
              {sort === 'highest_rated' && `The world's greatest courses by community rating${quickRegion === 'row' ? ' — Rest of World' : quickRegion !== 'global' ? ` in ${QUICK_REGION_TO_COUNTRY[quickRegion]}` : ''}`}
              {sort === 'rising' && `The world's greatest courses trending right now${quickRegion === 'row' ? ' — Rest of World' : quickRegion !== 'global' ? ` in ${QUICK_REGION_TO_COUNTRY[quickRegion]}` : ''}`}
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

                {/* Rankings List — white card container */}
                <div
                  ref={listContainerRef}
                  style={{
                    background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.07)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    marginTop: showPodium ? 16 : 0,
                  }}
                >
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
        </div>
      </div>

      {/* Create Game Sheet */}
      <CreateGameTripSheetV2
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
    </div>
  );
}

export default CoursesLeaderboardView;
