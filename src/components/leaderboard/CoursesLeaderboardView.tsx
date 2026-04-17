import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseLeaderboard, CourseSortType } from '@/hooks/useCourseLeaderboard';
import { useSpotlightCourse } from '@/hooks/useSpotlightCourse';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorialLedeSkeleton } from '@/components/leaderboards/shared/EditorialLedeSkeleton';
import { RefreshCw, WifiOff } from 'lucide-react';

const PAGE_SIZE = 20;
const STORAGE_KEY_FILTERS = 'courses-leaderboard-filters';
const STORAGE_KEY_SCROLL = 'courses-leaderboard-scroll';

type QuickRegion = 'global' | 'gb-i' | 'usa' | 'europe' | 'row';

const QUICK_REGION_TO_COUNTRY: Record<QuickRegion, string | null> = {
  'global': null,
  'gb-i': 'Britain & Ireland',
  'usa': 'USA',
  'europe': 'Continental Europe',
  'row': null,
};
const ROW_EXCLUDE_COUNTRIES = ['Britain & Ireland', 'USA', 'Continental Europe'];

interface SavedFilters {
  sort: CourseSortType;
  quickRegion: QuickRegion;
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

// ─── Tier 2 personalised eyebrow ─────────────────────────────────────
function selectCoursesEyebrow(args: {
  isLoggedIn: boolean;
  userPlayedCount: number;
  totalInList: number;
  bucketListMoved: { course: string; positions: number } | null;
  circleActivity: { player: string; course: string; rating: number } | null;
  defaultEyebrow: string;
}): string {
  if (!args.isLoggedIn) return args.defaultEyebrow;

  if (args.bucketListMoved) {
    return `ON YOUR RADAR · ${args.bucketListMoved.course.toUpperCase()}`;
  }

  if (args.circleActivity && args.circleActivity.rating >= 8.0) {
    return `FROM YOUR CIRCLE · ${args.circleActivity.player.toUpperCase()}`;
  }

  if (args.userPlayedCount === 0) return 'LOG A ROUND TO ENTER THE LIST';
  if (args.totalInList > 0 && args.userPlayedCount >= args.totalInList) return "YOU'VE COMPLETED THE LIST";
  if (args.userPlayedCount >= 50) return `YOU'VE PLAYED ${args.userPlayedCount} OF THE LIST`;

  return args.defaultEyebrow;
}

// NOTE: TrendArrow removed in audit fix — `rank_change` is hardcoded to 0 in the
// `get_course_leaderboard` RPC, so the trend column was permanently inert. Hide
// the column until snapshot infrastructure lands (Phase 2 backend work).
// See CoursesAuditBrief FIX 1.


const InitialErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', textAlign: 'center' }}>
    <WifiOff style={{ width: 48, height: 48, color: '#94A3B8', marginBottom: 16 }} />
    <p style={{ color: '#0F172A', fontWeight: 600, marginBottom: 4 }}>Unable to load course rankings</p>
    <p style={{ fontSize: 16, color: '#64748B', marginBottom: 16 }}>Check your connection and try again</p>
    <button
      onClick={onRetry}
      style={{
        padding: '10px 24px', borderRadius: 4, background: '#0F172A',
        color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
      }}
    >
      Retry
    </button>
  </div>
);

const InlineRetryCard = ({ onRetry }: { onRetry: () => void }) => (
  <div style={{ maxWidth: 480, margin: '16px auto 0', padding: '0 16px' }}>
    <button
      onClick={onRetry}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '14px', borderRadius: 4, background: '#fff', border: '1px solid rgba(15,23,42,0.10)',
        color: '#64748B', fontSize: 15, cursor: 'pointer',
      }}
    >
      <RefreshCw style={{ width: 14, height: 14 }} />
      Couldn't load more courses · Tap to retry
    </button>
  </div>
);

const RowSkeleton = () => (
  <div style={{ padding: '12px 0', display: 'grid', gridTemplateColumns: '26px 48px 1fr 44px', gap: 4, alignItems: 'center', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
    <Skeleton style={{ height: 16, width: 20 }} />
    <Skeleton style={{ height: 40, width: 40, borderRadius: 3 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton style={{ height: 14, width: '70%' }} />
      <Skeleton style={{ height: 10, width: '40%' }} />
    </div>
    <Skeleton style={{ height: 18, width: 36, marginLeft: 'auto' }} />
  </div>
);

export function CoursesLeaderboardView() {
  const navigate = useNavigate();

  // ─── Filter state ──────────────────────────────────────────────────
  const [sort, setSort] = useState<CourseSortType>(() => readSavedFilters()?.sort ?? 'highest_rated');
  const [quickRegion, setQuickRegion] = useState<QuickRegion>(() => readSavedFilters()?.quickRegion ?? 'global');

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({ sort, quickRegion }));
    } catch { /* ignore */ }
  }, [sort, quickRegion]);

  const quickRegionCountry = QUICK_REGION_TO_COUNTRY[quickRegion];

  // ─── Current user ──────────────────────────────────────────────────
  const { data: authUser } = useQuery({
    queryKey: ['courses-tab-auth-user'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // ─── Course leaderboard ────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useCourseLeaderboard({
    scope: 'worldwide',
    timeRange: 'all_time',
    sort,
    pageSize: PAGE_SIZE,
    region: quickRegion === 'row' ? null : quickRegionCountry,
    excludeCountries: quickRegion === 'row' ? ROW_EXCLUDE_COUNTRIES : null,
  });

  const allCourses = useMemo(() => data?.pages.flatMap(p => p.entries) ?? [], [data?.pages]);

  // ─── Sort-aware masthead derived from the list (single source of truth) ─
  const masthead = allCourses[0] ?? null;

  const mastheadCopy = useMemo(() => {
    if (!masthead) return null;

    const name = masthead.course_name;
    const ratingValue = masthead.avg_rating;
    const rating = ratingValue != null ? ratingValue.toFixed(1) : null;
    const plays = masthead.times_played ?? 0;
    const ratingCount = masthead.rating_count ?? 0;
    const ratingsLabel = ratingCount === 1 ? 'rating' : 'ratings';

    if (sort === 'highest_rated') {
      return {
        eyebrow: 'HIGHEST RATED',
        headline: name,
        headlineTwo: rating ? `sits at ${rating}` : 'leads the list',
        standfirst: rating
          ? `${name} leads the Clbhouz list, averaging ${rating} out of ten across ${ratingCount} ${ratingsLabel}.`
          : `${name} leads the Clbhouz list.`,
      };
    }

    if (sort === 'most_played') {
      return {
        eyebrow: 'MOST PLAYED',
        headline: name,
        headlineTwo: `played ${plays} times`,
        standfirst: `${name} is the community's most-logged course, with ${plays} rounds on record.`,
      };
    }

    // sort === 'rising' (labelled "Trending" in the UI)
    return {
      eyebrow: 'TRENDING NOW',
      headline: name,
      headlineTwo: 'is climbing',
      standfirst: `${name} is picking up momentum, with ${ratingCount} ${ratingsLabel} from the Clbhouz community.`,
    };
  }, [masthead, sort]);

  // ─── Spotlight ─────────────────────────────────────────────────────
  const { data: spotlight, isLoading: spotlightLoading } = useSpotlightCourse();

  // ─── User played count + total in list ─────────────────────────────
  const { data: playedStats = { played: 0, total: 0 } } = useQuery<{ played: number; total: number }>({
    queryKey: ['courses-tab-played-stats', quickRegion, authUser?.id],
    staleTime: 60_000,
    queryFn: async () => {
      const country = quickRegionCountry;

      // Total in list (unique courses with ratings in scope)
      let totalQuery = supabase
        .from('course_ratings')
        .select('course_id, golf_courses!inner(country)')
        .eq('is_mock', false);
      if (country) {
        totalQuery = totalQuery.eq('golf_courses.country', country);
      } else if (quickRegion === 'row') {
        totalQuery = totalQuery
          .neq('golf_courses.country', 'Britain & Ireland')
          .neq('golf_courses.country', 'USA')
          .neq('golf_courses.country', 'Continental Europe');
      }
      const { data: totalRows } = await totalQuery;
      const total = new Set((totalRows ?? []).map((r: any) => r.course_id)).size;

      if (!authUser?.id) return { played: 0, total };

      const { data: ratedData } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', authUser.id)
        .eq('is_mock', false);

      const ratedIds = [...new Set((ratedData ?? []).map(r => r.course_id))];
      if (ratedIds.length === 0) return { played: 0, total };

      if (!country && quickRegion !== 'row') return { played: ratedIds.length, total };

      let courseQuery = supabase.from('golf_courses').select('id').in('id', ratedIds);
      if (country) {
        courseQuery = courseQuery.eq('country', country);
      } else {
        courseQuery = courseQuery
          .neq('country', 'Britain & Ireland')
          .neq('country', 'USA')
          .neq('country', 'Continental Europe');
      }
      const { data: filtered } = await courseQuery;
      return { played: filtered?.length ?? 0, total };
    },
  });

  const userPlayedCount = playedStats.played;
  const totalInList = playedStats.total;
  const pctOfList = totalInList > 0 ? Math.round((userPlayedCount / totalInList) * 100) : 0;
  const toGoCount = Math.max(0, totalInList - userPlayedCount);

  // ─── Circle recent rounds ──────────────────────────────────────────
  const { data: circleRecentRounds } = useQuery({
    queryKey: ['circle-recent-top100-rounds', authUser?.id],
    enabled: !!authUser?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!authUser?.id) return [];

      const { data: followingRows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', authUser.id);

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
          golf_courses!inner (id, name, thumbnail_image, global_rank, regional_rank, usa_rank),
          user_profiles!inner (id, display_name, profile_photo_url)
        `)
        .in('user_id', followingIds)
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null', { foreignTable: 'golf_courses' })
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
  });

  // ─── Bucket list moved (defensive) ─────────────────────────────────
  const { data: bucketListMoved } = useQuery<{ course: string; positions: number } | null>({
    queryKey: ['courses-tab-bucket-moved', authUser?.id],
    enabled: !!authUser?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        if (!authUser?.id) return null;
        const { data: shortlistRows, error } = await supabase
          .from('course_shortlists')
          .select('course_id')
          .eq('user_id', authUser.id);
        if (error || !shortlistRows || shortlistRows.length === 0) return null;
        const ids = new Set(shortlistRows.map(r => r.course_id));
        // Find the largest positive mover among shortlisted courses currently in scope
        const candidates = allCourses
          .filter(c => ids.has(c.course_id) && c.rank_change > 0)
          .sort((a, b) => b.rank_change - a.rank_change);
        if (candidates.length === 0) return null;
        return { course: candidates[0].course_name, positions: candidates[0].rank_change };
      } catch {
        return null;
      }
    },
  });

  // ─── Personalised eyebrow ──────────────────────────────────────────
  const personalisedEyebrow = useMemo(() => {
    const fallback = mastheadCopy?.eyebrow ?? 'THE CLBHOUZ LIST';
    const topCircle = circleRecentRounds?.[0] as any;
    const circleActivity = topCircle
      ? {
          player: topCircle.user_profiles?.display_name ?? 'A friend',
          course: topCircle.golf_courses?.name ?? '',
          rating: Number(topCircle.rating ?? 0),
        }
      : null;

    return selectCoursesEyebrow({
      isLoggedIn: !!authUser?.id,
      userPlayedCount,
      totalInList,
      bucketListMoved: bucketListMoved ?? null,
      circleActivity,
      defaultEyebrow: fallback,
    });
  }, [mastheadCopy?.eyebrow, circleRecentRounds, authUser?.id, userPlayedCount, totalInList, bucketListMoved]);

  // ─── Infinite scroll ───────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
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

  // ─── Scroll save/restore ───────────────────────────────────────────
  const handleCourseClick = useCallback((courseId: string) => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
    navigate(`/courses/${courseId}`);
  }, [navigate]);

  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (hasRestoredScroll.current || allCourses.length === 0) return;
    const saved = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (saved) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const target = parseInt(saved, 10);
        if (rootEl) rootEl.scrollTop = target;
        window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allCourses.length]);

  // ─── (Editorial fallback removed — masthead now derives from list data) ──

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#F8FAFC', fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* ── MASTHEAD ─────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '3px double #0F172A', textAlign: 'center', background: '#F8FAFC' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 800, color: '#9F1D1D', letterSpacing: '0.18em',
          marginBottom: 12, minHeight: 14,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F1D1D' }} />
          <span>RANKINGS REFRESHED DAILY</span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.035em', margin: 0, lineHeight: 0.95, color: '#0F172A' }}>
          The Course Record
        </h1>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.32em', color: '#64748B', marginTop: 6 }}>
          THE WORLD'S GREATEST COURSES
        </div>
      </div>

      {/* ── SORT TOGGLE ──────────────────────────────────────────── */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        {[
          { key: 'highest_rated' as const, label: 'Highest Rated' },
          { key: 'most_played' as const, label: 'Most Played' },
          { key: 'rising' as const, label: 'Trending' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              background: sort === opt.key ? '#0F172A' : 'transparent',
              color: sort === opt.key ? '#fff' : '#64748B',
              border: sort === opt.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
              fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── FRONT-PAGE LEDE ──────────────────────────────────────── */}
      {isLoading && !masthead ? (
        <EditorialLedeSkeleton />
      ) : mastheadCopy ? (
        <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.28em', color: '#9F1D1D', marginBottom: 10 }}>
            {personalisedEyebrow}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05, color: '#0F172A' }}>
            {mastheadCopy.headline}
            {mastheadCopy.headlineTwo && (
              <>
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 900, color: '#475569' }}>
                  {mastheadCopy.headlineTwo}
                </span>
              </>
            )}
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
            {mastheadCopy.standfirst}
          </p>
        </div>
      ) : null}

      {/* ── BOX SCORE ────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          borderTop: '1px solid #0F172A', borderBottom: '1px solid #0F172A',
          padding: '16px 0',
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.18em', marginBottom: 4 }}>PLAYED</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#9F1D1D', fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {userPlayedCount}
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.18em', marginBottom: 4 }}>OF LIST</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#9F1D1D', fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {pctOfList}<span style={{ fontSize: 18, color: '#475569' }}>%</span>
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.18em', marginBottom: 4 }}>TO GO</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#0F172A', fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {totalInList === 0 ? '—' : (toGoCount === 0 ? '—' : toGoCount)}
            </div>
          </div>
        </div>
      </div>

      {/* ── THIS SEASON'S HOTTEST ───────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>
        {spotlightLoading ? (
          <div style={{
            width: '100%', height: 260, background: '#0F172A', borderRadius: 4,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 160,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            }} />
            <div style={{ padding: '180px 18px 14px' }}>
              <Skeleton style={{ height: 22, width: '65%', marginBottom: 6 }} />
              <Skeleton style={{ height: 11, width: '40%' }} />
            </div>
          </div>
        ) : spotlight ? (
          <button
            onClick={() => handleCourseClick(spotlight.course_id)}
            style={{
              width: '100%',
              background: '#0F172A', color: '#fff', borderRadius: 4,
              overflow: 'hidden', position: 'relative',
              border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
            }}
          >
            <div style={{
              height: 160,
              background: spotlight.image_url
                ? `linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.7) 100%), url(${spotlight.image_url}) center/cover`
                : 'linear-gradient(180deg, #2d5a3d, #1a3d2e)',
              position: 'relative',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                position: 'absolute', top: 10, left: 10,
                fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.22em',
                background: 'rgba(0,0,0,0.4)',
                padding: '4px 8px', borderRadius: 2,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}>
                THIS SEASON'S HOTTEST
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 4 }}>
                {spotlight.course_name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                {[spotlight.city, spotlight.country].filter(Boolean).join(', ')}
              </div>
              <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.22em', marginBottom: 2 }}>
                    RATING
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {spotlight.avg_rating ? spotlight.avg_rating.toFixed(1) : '—'}
                  </div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.22em', marginBottom: 2 }}>
                    PLAYS
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {spotlight.total_rounds ?? 0}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginLeft: 4 }}>this season</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {/* ── BY REGION ────────────────────────────────────────────── */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em' }}>BY REGION</span>
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'global' as const, label: 'Global' },
            { key: 'gb-i' as const, label: 'GB&I' },
            { key: 'usa' as const, label: 'USA' },
            { key: 'europe' as const, label: 'Europe' },
            { key: 'row' as const, label: 'Rest of World' },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setQuickRegion(r.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap',
                background: quickRegion === r.key ? '#0F172A' : 'transparent',
                color: quickRegion === r.key ? '#fff' : '#64748B',
                border: quickRegion === r.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FROM YOUR CIRCLE ────────────────────────────────────── */}
      {circleRecentRounds && circleRecentRounds.length > 0 && (
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
            <div style={{ width: 12, height: 1, background: '#0F172A' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em' }}>FROM YOUR CIRCLE</span>
            <div style={{ width: 12, height: 1, background: '#0F172A' }} />
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
            {circleRecentRounds.slice(0, 10).map((round: any) => {
              const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(round.created_at).getTime()) / 86400000));
              const course = round.golf_courses;
              const player = round.user_profiles;
              if (!course || !player) return null;
              return (
                <button
                  key={round.id}
                  onClick={() => handleCourseClick(course.id)}
                  style={{
                    flexShrink: 0, width: 200,
                    border: '1px solid rgba(15,23,42,0.08)', borderRadius: 4,
                    background: '#fff', overflow: 'hidden',
                    cursor: 'pointer', padding: 0, textAlign: 'left',
                  }}
                >
                  <div style={{
                    height: 80,
                    background: course.thumbnail_image
                      ? `url(${course.thumbnail_image}) center/cover`
                      : 'linear-gradient(135deg, #2d5a3d, #1a3d2e)',
                  }} />
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.005em',
                      marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {course.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {player.display_name}
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 900, color: '#F7931E',
                        fontVariantNumeric: 'tabular-nums lining-nums',
                        letterSpacing: '-0.02em', marginLeft: 6, flexShrink: 0,
                      }}>
                        {round.rating?.toFixed(1) ?? '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
                      {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── THE FULL LIST ───────────────────────────────────────── */}
      <div style={{ padding: '26px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em' }}>
            THE FULL LIST
          </span>
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Column headers — trend column hidden until snapshot infra lands (FIX 1) */}
        <div style={{
          display: 'grid', gridTemplateColumns: '26px 48px 1fr 44px',
          padding: '10px 0 8px',
          borderBottom: '1px solid #0F172A',
          fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.18em',
          alignItems: 'center',
        }}>
          <span>POS</span>
          <span />
          <span>COURSE</span>
          <span style={{ textAlign: 'right' }}>RATING</span>
        </div>

        {/* Initial error */}
        {isError && allCourses.length === 0 ? (
          <InitialErrorState onRetry={() => refetch()} />
        ) : isLoading && allCourses.length === 0 ? (
          <>{[...Array(8)].map((_, i) => <RowSkeleton key={i} />)}</>
        ) : allCourses.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#94A3B8', fontStyle: 'italic' }}>
              No courses match this view yet.
            </p>
          </div>
        ) : (
          allCourses.map((c, i) => {
            const isLast = i === allCourses.length - 1;
            const isTop3 = c.rank <= 3;
            return (
              <div
                key={c.course_id}
                onClick={() => handleCourseClick(c.course_id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26px 48px 1fr 44px',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: isLast ? '1px solid #0F172A' : '1px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer',
                }}
              >
                {/* Rank */}
                <span style={{
                  fontSize: 18, fontWeight: 900,
                  color: isTop3 ? '#0F172A' : '#94A3B8',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  letterSpacing: '-0.02em',
                }}>
                  {c.rank}
                </span>

                {/* Thumbnail (FIX 5: removed redundant played badge — amber PLAYED text below carries the signal) */}
                <div style={{
                  width: 40, height: 40, borderRadius: 3,
                  background: c.thumbnail_url
                    ? `url(${c.thumbnail_url}) center/cover`
                    : 'linear-gradient(135deg, #2d5a3d, #1a3d2e)',
                  border: '1px solid rgba(15,23,42,0.08)',
                }} />

                {/* Name + location */}
                <div style={{ minWidth: 0, paddingLeft: 4 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: '#0F172A',
                    letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.course_name}
                  </div>
                  <div style={{
                    fontSize: 11, color: '#94A3B8', marginTop: 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                    overflow: 'hidden', whiteSpace: 'nowrap',
                  }}>
                    {c.current_user_played && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: '#F7931E',
                        letterSpacing: '0.18em',
                        flexShrink: 0,
                      }}>
                        PLAYED
                      </span>
                    )}
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {[c.sub_country, c.country].filter(Boolean).join(' · ')}
                      {' · '}{c.times_played} {c.times_played === 1 ? 'play' : 'plays'}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <span style={{
                  fontSize: 22, fontWeight: 900, textAlign: 'right',
                  color: '#0F172A', letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}>
                  {c.avg_rating?.toFixed(1) ?? '—'}
                </span>
              </div>
            );
          })
        )}

        {/* Sentinel for infinite scroll */}
        {hasNextPage && !isError && (
          <div ref={sentinelRef}>
            {isFetchingNextPage && <>{[...Array(3)].map((_, i) => <RowSkeleton key={i} />)}</>}
          </div>
        )}

        {isError && !isFetchingNextPage && allCourses.length > 0 && (
          <InlineRetryCard onRetry={() => fetchNextPage()} />
        )}
      </div>

      {/* ── FOOTER CAPTION ──────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#94A3B8', letterSpacing: '0.06em', fontStyle: 'italic' }}>
          Ranked by community rating across verified rounds · Updated daily
        </div>
      </div>
    </div>
  );
}

export default CoursesLeaderboardView;
