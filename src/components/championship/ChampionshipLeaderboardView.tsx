import { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getProfilePathById } from '@/lib/profileRoutes';

import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useSeasonCalendar,
  useDailyEditorial,
  useChampionshipDispatches,
} from '@/hooks/championship';
import type { EditorialCopy } from '@/hooks/championship/useDailyEditorial';
import type { ChampionshipDispatch } from '@/hooks/championship';
import { ClubSearchBar } from '@/components/leaderboards/exploration/ClubSearchBar';
import { CountrySelector } from '@/components/leaderboards/shared/CountrySelector';
import { EditorialLedeSkeleton } from '@/components/leaderboards/shared/EditorialLedeSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { SEASON_ORDER, getSeasonConfig, getChipStatus, type SeasonId } from '@/lib/seasonConfig';
import type { ChampionshipArenaMode, DivisionSlug } from '@/types/championship';
import { abbreviateDivision } from '@/types/championship';
import { supabase } from '@/integrations/supabase/client';

// ─── Persistence helpers ────────────────────────────────────────────
const STORAGE_KEY_FILTERS = 'championship-leaderboard-filters';
const STORAGE_KEY_SCROLL = 'championship-leaderboard-scroll';

interface SavedFilters {
  scope: ChampionshipArenaMode;
  timeFilter: 'seasonal' | 'all_time';
  divisionFilter: DivisionSlug | 'all';
  clubId: string | null;
  country: string | null;
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

// ─── Helpers ────────────────────────────────────────────────────────
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDispatchTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

interface WireTickerProps {
  dispatches: ChampionshipDispatch[];
  onDispatchClick: (dispatch: ChampionshipDispatch) => void;
}

function WireTicker({ dispatches, onDispatchClick }: WireTickerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion || dispatches.length <= 1) return;
    const tid = setInterval(() => {
      setIndex((i) => (i + 1) % dispatches.length);
    }, 5_000);
    return () => clearInterval(tid);
  }, [paused, prefersReducedMotion, dispatches.length]);

  useEffect(() => {
    if (index >= dispatches.length) setIndex(0);
  }, [dispatches.length, index]);

  if (dispatches.length === 0) return null;
  const current = dispatches[index];
  if (!current) return null;

  const goPrev = () => setIndex((i) => (i - 1 + dispatches.length) % dispatches.length);
  const goNext = () => setIndex((i) => (i + 1) % dispatches.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartXRef.current;
        if (start !== null) {
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(dx) > 30) {
            if (dx > 0) goPrev();
            else goNext();
          }
        }
        touchStartXRef.current = null;
        setTimeout(() => setPaused(false), 1500);
      }}
      style={{
        margin: '14px 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 28,
        padding: '0 10px',
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.10)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#9F1D1D',
          flexShrink: 0,
          animation: prefersReducedMotion ? undefined : 'wirePulse 1.6s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: '#9F1D1D',
          flexShrink: 0,
        }}
      >
        WIRE
      </span>
      <div style={{ width: 1, height: 14, background: 'rgba(15,23,42,0.12)', flexShrink: 0 }} />
      <button
        type="button"
        onClick={() => onDispatchClick(current)}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: current.subject_user_id ? 'pointer' : 'default',
          fontSize: 12,
          fontWeight: 600,
          color: '#0F172A',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.005em',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
        aria-label={current.body}
      >
        {current.body}
      </button>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#94A3B8',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatDispatchTime(current.surfaced_at)}
      </span>
      {dispatches.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous dispatch"
            style={{
              width: 16, height: 16, padding: 0, border: 'none',
              background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <ChevronLeft size={12} />
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'center' }}>
            {index + 1}/{dispatches.length}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next dispatch"
            style={{
              width: 16, height: 16, padding: 0, border: 'none',
              background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}



function formatSeasonName(id: SeasonId): string {
  switch (id) {
    case 'major':     return 'MAJOR SEASON';
    case 'summer':    return 'SUMMER SEASON';
    case 'preseason': return 'PRE-SEASON';
    case 'offseason': return 'OFF-SEASON';
  }
}

function getDayOfSeason(startDate: string | null | undefined): number {
  if (!startDate) return 1;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.max(1, Math.floor((now - start) / 86_400_000) + 1);
}

interface SelectEyebrowArgs {
  userRank: number | null;
  rankMovementWeekly: number;
  daysRemaining: number;
  seasonLabel: string;
  isSeasonClosing: boolean;
  defaultEyebrow: string;
  dayOfSeason: number;
}

function selectEyebrow(args: SelectEyebrowArgs): string {
  if (args.userRank === null) {
    return `RATE A COURSE TO ENTER · ${args.seasonLabel.toUpperCase()}`;
  }
  if (args.isSeasonClosing) {
    return `FINAL DAYS · ${args.daysRemaining}D REMAINING`;
  }
  if (args.userRank <= 10 && args.rankMovementWeekly > 0) {
    return `YOU CLIMBED · ${args.seasonLabel.toUpperCase()} DAY ${args.dayOfSeason}`;
  }
  if (args.userRank <= 10 && args.rankMovementWeekly < 0) {
    return `DEFEND YOUR PLACE · ${args.seasonLabel.toUpperCase()}`;
  }
  if (args.userRank <= 30) {
    return `YOUR RACE · ${args.seasonLabel.toUpperCase()}`;
  }
  return args.defaultEyebrow;
}

function buildBaselineEditorial(args: {
  timeFilter: 'seasonal' | 'all_time';
  seasonLabel: string;
  leaderName: string | null;
  leaderCourses: number;
}): EditorialCopy {
  const firstName = (args.leaderName || 'The leader').split(' ')[0];
  if (args.timeFilter === 'all_time') {
    return {
      eyebrow: 'THE ALL-TIME RECORD',
      headline: `${firstName} leads`,
      headlineTwo: 'the all-time standings.',
      standfirst: `${args.leaderName || 'The leader'} sits atop the clbhouz record with ${args.leaderCourses} courses played to date.`,
      storyType: 'all_time_steady',
      generatedBy: 'template',
      date: new Date().toISOString().slice(0, 10),
    };
  }
  return {
    eyebrow: `${args.seasonLabel.toUpperCase()} · LIVE`,
    headline: `${firstName} holds the lead`,
    headlineTwo: `at ${args.leaderCourses} courses.`,
    standfirst: `${args.leaderName || 'The leader'} continues to set the pace in the ${args.seasonLabel.toLowerCase()}.`,
    storyType: 'mid_season_quiet',
    generatedBy: 'template',
    date: new Date().toISOString().slice(0, 10),
  };
}

// ─── Sub-components ─────────────────────────────────────────────────
const InitialErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <WifiOff className="w-12 h-12" style={{ color: '#94A3B8' }} />
    <p style={{ marginTop: 12, fontWeight: 800, color: '#0F172A', fontSize: 16 }}>Unable to load standings</p>
    <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Check your connection and try again</p>
    <button
      onClick={onRetry}
      style={{
        marginTop: 14, padding: '8px 18px', borderRadius: 4,
        background: '#0F172A', color: '#fff', fontSize: 12, fontWeight: 800,
        letterSpacing: '0.18em', border: 'none', cursor: 'pointer',
      }}
    >
      RETRY
    </button>
  </div>
);

const InlineRetryCard = ({ onRetry }: { onRetry: () => void }) => (
  <div style={{ padding: '14px 0' }}>
    <button
      onClick={onRetry}
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 4,
        background: 'transparent', border: '1px solid rgba(15,23,42,0.15)',
        color: '#64748B', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer',
      }}
    >
      <RefreshCw style={{ width: 13, height: 13 }} />
      Couldn't load more · Tap to retry
    </button>
  </div>
);

interface ChampionshipLeaderboardViewProps {
  className?: string;
}

/**
 * ChampionshipLeaderboardView — Front Page edition.
 * Editorial newspaper layout with masthead, lede, box score, prize/sponsor card,
 * schedule strip, and full standings. All "serif moments" use Geist 900.
 */
interface ChaseStatement {
  priority: number;
  text: string;
  emphasis?: 'positive' | 'negative' | 'neutral';
}

interface ChaseStatementsArgs {
  currentRank: number;
  rankMovementWeekly: number;
  daysRemaining: number;
  closestRivalName: string | null;
  closestRivalGap: number;
  coursesToPromotion: number;
  nextDivisionName: string | null;
  streakCurrent: number;
  streakBest: number;
  bestRankThisSeason: number;
}

function buildChaseStatements(args: ChaseStatementsArgs): ChaseStatement[] {
  const out: ChaseStatement[] = [];

  // P1 — Pace projection
  const weeksRemaining = Math.max(0, args.daysRemaining / 7);
  if (weeksRemaining > 0.5) {
    const movement = args.rankMovementWeekly;
    const projectedRank = Math.max(1, Math.round(args.currentRank - movement * weeksRemaining));
    const finishLabel = args.daysRemaining <= 7 ? 'this Sunday' : `in ${Math.round(weeksRemaining)} weeks`;

    if (movement > 0) {
      out.push({
        priority: 1,
        text: `At your current pace you'll finish ${ordinal(projectedRank)} ${finishLabel}.`,
        emphasis: 'positive',
      });
    } else if (movement < 0) {
      out.push({
        priority: 1,
        text: `On current pace, you'll drift to ${ordinal(projectedRank)} ${finishLabel}.`,
        emphasis: 'negative',
      });
    } else {
      out.push({
        priority: 1,
        text: `Hold pace and you'll finish ${ordinal(args.currentRank)}.`,
        emphasis: 'neutral',
      });
    }
  }

  // P2 — Closest rival
  if (args.closestRivalName && args.closestRivalGap > 0) {
    const courses = args.closestRivalGap === 1 ? 'course' : 'courses';
    out.push({
      priority: 2,
      text: `${args.closestRivalName} is ${args.closestRivalGap} ${courses} ahead — playable.`,
      emphasis: 'neutral',
    });
  }

  // P3 — Division promotion
  if (args.coursesToPromotion > 0 && args.nextDivisionName) {
    const courses = args.coursesToPromotion === 1 ? 'course' : 'courses';
    out.push({
      priority: 3,
      text: `${args.coursesToPromotion} ${courses} to reach ${args.nextDivisionName}.`,
      emphasis: 'positive',
    });
  }

  // P4 — Streak callout
  if (args.streakCurrent >= 3 && args.streakCurrent >= args.streakBest) {
    out.push({
      priority: 4,
      text: `Your ${args.streakCurrent}-week streak is your longest this season.`,
      emphasis: 'positive',
    });
  }

  // P5 — Peak comeback
  if (args.bestRankThisSeason > 0 && args.currentRank - args.bestRankThisSeason >= 3) {
    out.push({
      priority: 5,
      text: `You peaked at ${ordinal(args.bestRankThisSeason)} this season.`,
      emphasis: 'neutral',
    });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

function LedeFactor({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 12, padding: '8px 12px', borderRadius: 8,
      background: 'rgba(15,23,42,0.04)',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: '#64748B',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 800, color: '#0F172A',
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}>
        {value}
      </span>
    </div>
  );
}

export function ChampionshipLeaderboardView({ className }: ChampionshipLeaderboardViewProps) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['championship-leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['season-calendar'] });
  }, [queryClient]);

  // ─── Filter state with persistence ───────────────────────────────
  const [arenaMode, setArenaMode] = useState<ChampionshipArenaMode>(() => {
    const saved = readSavedFilters();
    return saved?.scope ?? 'global';
  });
  const [divisionFilter, setDivisionFilter] = useState<DivisionSlug | 'all'>(() => {
    const saved = readSavedFilters();
    return saved?.divisionFilter ?? 'all';
  });
  const [timeFilter, setTimeFilter] = useState<'seasonal' | 'all_time'>(() => {
    const saved = readSavedFilters();
    return saved?.timeFilter ?? 'seasonal';
  });

  const [showSponsorSheet, setShowSponsorSheet] = useState(false);
  const [showLedeInfoSheet, setShowLedeInfoSheet] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.clubId ?? null;
  });
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.country ?? null;
  });

  const scrollPositionRef = useRef<number>(0);
  const isFilterChangeRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
        scope: arenaMode,
        timeFilter,
        divisionFilter,
        clubId: selectedClubId,
        country: selectedCountry,
      }));
    } catch { /* ignore */ }
  }, [arenaMode, timeFilter, divisionFilter, selectedClubId, selectedCountry]);

  // Fetch user's home club + country (used by Club / Country arenas)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country, golf_clubs!user_profiles_primary_club_id_fkey(id, name, country)')
        .eq('id', userId)
        .single();
      if (error) return;

      const clubData = Array.isArray(data.golf_clubs) ? data.golf_clubs[0] : data.golf_clubs;
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName(clubData?.name || null);
      }
      const clubCountry = (clubData as any)?.country ?? null;
      const profileCountry = (data as any)?.country ?? null;
      setUserCountry(clubCountry || profileCountry || null);
    };
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (arenaMode === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [arenaMode, selectedClubId, userHomeClubId, userHomeClubName]);

  useEffect(() => {
    if (arenaMode !== 'country') setSelectedCountry(null);
  }, [arenaMode]);

  const handleClubSelect = useCallback((clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  }, []);

  const queryClubId = arenaMode === 'club' ? selectedClubId : null;
  const queryCountry = arenaMode === 'country' ? selectedCountry : null;

  // ─── Data fetching ────────────────────────────────────────────────
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useChampionshipLeaderboard({
    arenaMode,
    divisionFilter,
    timeFilter,
    clubId: queryClubId,
    country: queryCountry,
    pageSize: 50,
  });

  const { data: userStatus } = useUserChampionshipStatus(userId);
  const { data: seasonCalendar } = useSeasonCalendar();

  const allEntries = useMemo(
    () => leaderboardData?.pages.flatMap((p) => p.entries) ?? [],
    [leaderboardData?.pages],
  );

  const season = leaderboardData?.pages[0]?.season ?? null;
  const seasonYear = season?.start_date ? new Date(season.start_date).getFullYear() : new Date().getFullYear();
  const seasonLabel = `${seasonYear} Season`;
  const daysRemaining = season?.days_remaining ?? 0;
  const dayOfSeason = useMemo(() => getDayOfSeason(season?.start_date), [season?.start_date]);

  // Map current season → SeasonId for schedule strip
  const mapToSeasonId = (name: string): SeasonId => {
    const lower = name.toLowerCase();
    if (lower.includes('pre-season') || lower.includes('preseason') || lower.includes('training')) return 'preseason';
    if (lower.includes('major')) return 'major';
    if (lower.includes('summer')) return 'summer';
    if (lower.includes('off-season') || lower.includes('offseason')) return 'offseason';
    return 'preseason';
  };
  const currentSeasonId = useMemo<SeasonId>(() => {
    if (!season) return 'preseason';
    return mapToSeasonId(season.name);
  }, [season]);

  // ─── Editorial ───────────────────────────────────────────────────
  const { data: editorialData, isPending: editorialPending } = useDailyEditorial({
    seasonId: timeFilter === 'seasonal' ? season?.id ?? null : null,
    timeFilter,
    enabled: timeFilter === 'all_time' || !!season?.id,
  });

  const leader = allEntries[0] ?? null;
  const leaderCourses = leader?.courses_this_season ?? 0;

  const finalEditorial: EditorialCopy = useMemo(() => {
    return editorialData ?? buildBaselineEditorial({
      timeFilter,
      seasonLabel,
      leaderName: leader?.display_name ?? null,
      leaderCourses,
    });
  }, [editorialData, timeFilter, seasonLabel, leader?.display_name, leaderCourses]);

  const personalisedEyebrow = useMemo(() => {
    if (timeFilter === 'all_time') return finalEditorial.eyebrow || 'THE ALL-TIME RECORD';
    return selectEyebrow({
      userRank: userStatus?.current_rank ?? null,
      rankMovementWeekly: userStatus?.rank_movement_weekly ?? 0,
      daysRemaining,
      seasonLabel,
      isSeasonClosing: daysRemaining > 0 && daysRemaining <= 7,
      defaultEyebrow: finalEditorial.eyebrow,
      dayOfSeason,
    });
  }, [timeFilter, finalEditorial.eyebrow, userStatus, daysRemaining, seasonLabel, dayOfSeason]);

  // ─── Box score values ────────────────────────────────────────────
  const currentUserEntry = useMemo(
    () => allEntries.find((e) => e.is_current_user) ?? null,
    [allEntries],
  );

  const userIsLeader = !!currentUserEntry && currentUserEntry.current_rank === 1;
  const youCourses: number | null = currentUserEntry?.courses_this_season ?? null;
  const second = allEntries[1] ?? null;
  const gap: number | null = userIsLeader
    ? second
      ? Math.max(0, leaderCourses - (second.courses_this_season ?? 0))
      : null // No second player to lead — surface as em-dash
    : youCourses !== null
      ? Math.max(0, leaderCourses - youCourses)
      : null;

  // ─── On the chase: predictive statements (current user, seasonal only) ───
  const chaseStatements = useMemo<ChaseStatement[]>(() => {
    if (!currentUserEntry || !userStatus) return [];
    if (timeFilter === 'all_time') return [];
    if (!season || daysRemaining <= 0) return [];

    return buildChaseStatements({
      currentRank: currentUserEntry.current_rank,
      rankMovementWeekly: currentUserEntry.rank_movement ?? userStatus.rank_movement_weekly ?? 0,
      daysRemaining,
      closestRivalName: userStatus.closest_rival?.display_name ?? null,
      closestRivalGap: userStatus.closest_rival?.gap ?? 0,
      coursesToPromotion: userStatus.courses_to_next_division ?? 0,
      nextDivisionName: userStatus.next_division_name ?? null,
      streakCurrent: userStatus.streak_current ?? 0,
      streakBest: userStatus.streak_best ?? 0,
      bestRankThisSeason: userStatus.best_rank_this_season ?? 0,
    });
  }, [currentUserEntry, userStatus, timeFilter, season, daysRemaining]);

  // ─── Scroll save/restore ─────────────────────────────────────────
  const handleEntryClick = useCallback((clickedUserId: string) => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
    navigate(getProfilePathById(clickedUserId) + '?tab=top100');
  }, [navigate]);

  // ─── Wire ticker dispatches (seasonal mode only) ─────────────────
  const { data: dispatches } = useChampionshipDispatches({
    limit: 10,
    enabled: timeFilter === 'seasonal',
  });

  const handleDispatchClick = useCallback((dispatch: ChampionshipDispatch) => {
    if (!dispatch.subject_user_id) return;
    navigate(getProfilePathById(dispatch.subject_user_id) + '?tab=top100');
  }, [navigate]);

  useEffect(() => {
    if (hasRestoredScroll.current || allEntries.length === 0) return;
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
  }, [allEntries.length]);

  // ─── Filter handlers (preserve scroll) ───────────────────────────
  const handleArenaModeChange = useCallback((mode: ChampionshipArenaMode) => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setArenaMode(mode);
  }, []);

  const handleDivisionFilterChange = useCallback((filter: DivisionSlug | 'all') => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      scrollPositionRef.current = rootEl.scrollTop;
      isFilterChangeRef.current = true;
    }
    setDivisionFilter(filter);
  }, []);

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
  }, [arenaMode, divisionFilter, allEntries]);

  // ─── Infinite scroll ─────────────────────────────────────────────
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

  // ─── Arena tabs config ───────────────────────────────────────────
  const totalCount = leaderboardData?.pages?.[0]?.total_count ?? null;

  const arenas: { key: ChampionshipArenaMode; label: string; count?: number | null }[] = [
    { key: 'global', label: 'Global' },
    { key: 'division', label: 'Division' },
    { key: 'friends', label: 'Friends', count: arenaMode === 'friends' ? totalCount : null },
    { key: 'club', label: 'Club', count: arenaMode === 'club' ? totalCount : null },
    { key: 'country', label: 'Country' },
  ];

  const divisionChips: { key: DivisionSlug | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'rookie', label: 'Rookie' },
    { key: 'fairway', label: 'Fairway' },
    { key: 'founders', label: 'Founders' },
    { key: 'heritage', label: 'Heritage' },
    { key: 'century', label: 'Century' },
    { key: 'elite', label: 'Elite' },
    { key: 'legendary', label: 'Legendary' },
    { key: 'grandslam', label: 'Grand Slam' },
  ];

  // ─── Filter reset / active state ─────────────────────────────────
  const handleResetFilters = useCallback(() => {
    setArenaMode('global');
    setDivisionFilter('all');
    setSelectedClubId(null);
    setSelectedClubName(null);
    setSelectedCountry(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_FILTERS);
    } catch {
      /* ignore */
    }
  }, []);

  const hasActiveFilters = useMemo(() => {
    return arenaMode !== 'global'
      || divisionFilter !== 'all'
      || selectedClubId !== null
      || selectedCountry !== null;
  }, [arenaMode, divisionFilter, selectedClubId, selectedCountry]);

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (arenaMode === 'friends') parts.push('Friends');
    if (arenaMode === 'club' && selectedClubName) parts.push(selectedClubName);
    if (arenaMode === 'country' && selectedCountry) parts.push(selectedCountry);
    if (divisionFilter !== 'all') {
      const div = divisionChips.find((d) => d.key === divisionFilter);
      if (div) parts.push(div.label);
    }
    return parts.join(' · ');
  }, [arenaMode, divisionFilter, selectedClubName, selectedCountry, divisionChips]);

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div
      className={cn('flex flex-col', className)}
      style={{
        background: '#F8FAFC',
        minHeight: '100%',
        marginLeft: '-16px',
        marginRight: '-16px',
      }}
    >
      {/* ── 1. MASTHEAD ── */}
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: '3px double #0F172A',
        textAlign: 'center',
        background: '#F8FAFC',
      }}>
        {/* TOP STRIP: single line, countdown-driven */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.18em',
          marginBottom: 12, fontVariantNumeric: 'tabular-nums lining-nums',
          minHeight: 14,
        }}>
          {timeFilter === 'all_time' ? (
            <span>ALL-TIME RECORD</span>
          ) : !season ? (
            <span style={{ visibility: 'hidden' }}>PLACEHOLDER</span>
          ) : daysRemaining > 0 ? (
            <>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F1D1D', display: 'inline-block' }} />
              <span style={{ color: '#9F1D1D' }}>{daysRemaining} DAYS LEFT IN {formatSeasonName(currentSeasonId)}</span>
            </>
          ) : (
            <>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9F1D1D', display: 'inline-block' }} />
              <span style={{ color: '#9F1D1D' }}>{formatSeasonName(currentSeasonId)} · FINAL DAY</span>
            </>
          )}
        </div>

        <h1 style={{
          fontSize: 38, fontWeight: 900, letterSpacing: '-0.035em',
          margin: 0, lineHeight: 0.95, color: '#0F172A',
        }}>
          The Top 100
        </h1>

        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.32em',
          color: '#64748B', marginTop: 6,
        }}>
          A CHAMPIONSHIP RECORD
        </div>

        {/* Sponsor "presented by" line — only when sponsor exists and seasonal mode */}
        {timeFilter === 'seasonal' && season?.sponsor_name && (
          <button
            type="button"
            onClick={() => setShowSponsorSheet(true)}
            aria-label={`Sponsored by ${season.sponsor_name}`}
            disabled={!season.sponsor_url}
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(15,23,42,0.15)',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              width: '100%',
              background: 'none',
              cursor: season.sponsor_url ? 'pointer' : 'default',
              padding: '12px 0 0',
            }}
            className={season.sponsor_url ? 'active:opacity-70 transition-opacity' : ''}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.22em',
              }}>
                PRESENTED BY
              </span>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: season.sponsor_logo_url ? '5px 10px' : '4px 10px',
                border: '1px solid rgba(15,23,42,0.12)',
                borderRadius: 4,
                background: '#fff',
              }}>
                {season.sponsor_logo_url ? (
                  <img
                    src={season.sponsor_logo_url}
                    alt={`${season.sponsor_name} logo`}
                    style={{
                      height: 20,
                      width: 'auto',
                      maxWidth: 140,
                      objectFit: 'contain',
                      display: 'block',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <>
                    <div style={{
                      width: 18,
                      height: 18,
                      background: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                      }}>
                        {season.sponsor_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#0F172A',
                      letterSpacing: '-0.01em',
                    }}>
                      {season.sponsor_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {season.prize_description && (
              <div style={{
                marginTop: 8,
                fontSize: 9,
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '0.04em',
                fontStyle: 'italic',
              }}>
                {season.prize_description} for season leader
              </div>
            )}
          </button>
        )}
      </div>

      {/* ── 2. TIME MODE TOGGLE ── */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        {([
          { key: 'seasonal' as const, label: seasonLabel },
          { key: 'all_time' as const, label: 'All-Time' },
        ]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setTimeFilter(opt.key)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              background: timeFilter === opt.key ? '#0F172A' : 'transparent',
              color: timeFilter === opt.key ? '#fff' : '#64748B',
              border: timeFilter === opt.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
              fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── 2.5. WIRE TICKER (seasonal only, conditional on dispatches) ── */}
      {timeFilter === 'seasonal' && dispatches && dispatches.length > 0 && (
        <WireTicker dispatches={dispatches} onDispatchClick={handleDispatchClick} />
      )}

      {/* ── 3. FRONT-PAGE LEDE ── */}
      {editorialPending ? (
        <EditorialLedeSkeleton />
      ) : (
        <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.28em',
            color: '#9F1D1D', marginBottom: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>{personalisedEyebrow}</span>
            <button
              type="button"
              onClick={() => setShowLedeInfoSheet(true)}
              aria-label="Why this headline"
              style={{
                background: 'none', padding: 0, cursor: 'pointer',
                width: 14, height: 14, borderRadius: '50%',
                border: '1px solid rgba(159,29,29,0.4)',
                color: '#9F1D1D',
                fontSize: 9, fontWeight: 800, lineHeight: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                letterSpacing: 0,
              }}
            >
              i
            </button>
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em',
            margin: 0, lineHeight: 1.05, color: '#0F172A',
          }}>
            {finalEditorial.headline}
            {finalEditorial.headlineTwo && (
              <>
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 900, color: '#475569' }}>
                  {finalEditorial.headlineTwo}
                </span>
              </>
            )}
          </h2>
          <p style={{
            fontSize: 13, color: '#64748B', lineHeight: 1.55,
            marginTop: 12, marginBottom: 0, fontStyle: 'italic',
          }}>
            {finalEditorial.standfirst}
          </p>
        </div>
      )}

      {/* ── 4. THE BOX SCORE ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          borderTop: '1px solid #0F172A',
          borderBottom: '1px solid #0F172A',
          padding: '16px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#94A3B8',
              letterSpacing: '0.18em', marginBottom: 4,
            }}>
              LEADER
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1, color: '#0F172A',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>
              {leaderCourses || '—'}
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#9F1D1D',
              letterSpacing: '0.18em', marginBottom: 4,
            }}>
              YOU
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1, color: '#9F1D1D',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>
              {youCourses ?? '—'}
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 9, fontWeight: 800,
              color: userIsLeader ? '#15803D' : '#94A3B8',
              letterSpacing: '0.18em', marginBottom: 4,
            }}>
              {userIsLeader ? 'LEAD' : 'GAP'}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1,
              color: userIsLeader ? '#15803D' : '#0F172A',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>
              {gap === null ? '—' : userIsLeader ? `+${gap}` : `−${gap}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4.5. ON THE CHASE PANEL (current user only, seasonal only) ── */}
      {chaseStatements.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            borderTop: '3px double #0F172A',
            borderBottom: '3px double #0F172A',
            padding: '16px 4px',
            background: '#fff',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: -8, left: '50%', transform: 'translateX(-50%)',
              background: '#F8FAFC', padding: '0 10px',
              fontSize: 9, fontWeight: 800, color: '#9F1D1D',
              letterSpacing: '0.28em',
            }}>
              ON THE CHASE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {chaseStatements.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'baseline', gap: 10,
                    padding: '4px 12px',
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: '#94A3B8',
                    letterSpacing: '0.18em', minWidth: 14,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 600,
                    color: s.emphasis === 'positive' ? '#15803D'
                      : s.emphasis === 'negative' ? '#9F1D1D'
                      : '#0F172A',
                    letterSpacing: '-0.005em',
                    lineHeight: 1.4,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}>
                    {s.text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 14,
              textAlign: 'center',
              fontSize: 9, fontWeight: 700, color: '#94A3B8',
              letterSpacing: '0.12em', fontStyle: 'italic',
            }}>
              Based on your weekly pace · Updated daily
            </div>
          </div>
        </div>
      )}

      {/* ── 5. PRIZE & SPONSOR CARD (Seasonal only) ── */}
      {timeFilter === 'seasonal' && season?.prize_description && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: '#0F172A', color: '#fff', borderRadius: 4,
            padding: '16px 18px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              background: 'radial-gradient(circle at top right, rgba(247,147,30,0.18), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 4,
                background: 'rgba(247,147,30,0.12)',
                border: '1px solid rgba(247,147,30,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0, color: '#F7931E',
              }}>♛</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.22em', marginBottom: 4,
                }}>
                  CHAMPIONSHIP PRIZE
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.03em', lineHeight: 1.05,
                }}>
                  {season.prize_description}
                </div>
              </div>
            </div>

            {season.sponsor_name && (
              <div style={{
                marginTop: 12, paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.22em', marginBottom: 2,
                  }}>
                    PRESENTED BY
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#F7931E',
                    letterSpacing: '-0.005em',
                  }}>
                    {season.sponsor_name}
                  </div>
                </div>
                {season.sponsor_url && (
                  <button
                    type="button"
                    onClick={() => setShowSponsorSheet(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    }}
                  >
                    {season.sponsor_url.replace(/^https?:\/\//, '').replace(/\/$/, '')} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. SEASON SCHEDULE (Seasonal only) ── */}
      {timeFilter === 'seasonal' && (
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
            <div style={{ width: 12, height: 1, background: '#0F172A' }} />
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em',
            }}>SCHEDULE</span>
            <div style={{ width: 12, height: 1, background: '#0F172A' }} />
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {SEASON_ORDER.map((sid, i) => {
              const config = getSeasonConfig(sid);
              const status = getChipStatus(sid, currentSeasonId);
              const labelTop = status === 'completed'
                ? 'DONE'
                : status === 'active'
                  ? '● LIVE'
                  : `RD ${i + 1}`;
              return (
                <div
                  key={sid}
                  style={{
                    borderRight: i < 3 ? '1px solid rgba(15,23,42,0.1)' : 'none',
                    padding: '10px 8px', textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', marginBottom: 4,
                    color: status === 'active' ? '#9F1D1D' : '#94A3B8',
                  }}>
                    {labelTop}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: status === 'active' ? '#0F172A'
                      : status === 'completed' ? '#94A3B8'
                      : '#64748B',
                  }}>
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. FULL STANDINGS ── */}
      <div style={{ padding: '26px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em',
          }}>
            {timeFilter === 'all_time' ? 'ALL-TIME STANDINGS' : 'FULL STANDINGS'}
          </span>
          <div style={{ width: 12, height: 1, background: '#0F172A' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Arena tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, justifyContent: 'center' }}>
          {arenas.map((a) => {
            const isActive = arenaMode === a.key;
            return (
              <button
                key={a.key}
                onClick={() => handleArenaModeChange(a.key)}
                style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: isActive ? '#0F172A' : 'transparent',
                  color: isActive ? '#fff' : '#64748B',
                  border: isActive ? 'none' : '1px solid rgba(15,23,42,0.15)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                {a.label}
                {a.count != null && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    padding: '1px 5px', borderRadius: 6,
                    background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)',
                    color: isActive ? '#fff' : '#64748B',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    letterSpacing: 0,
                  }}>
                    {a.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Division sub-filter */}
        {arenaMode === 'division' && (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex', gap: 4, marginBottom: 10, marginTop: 8,
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {divisionChips.map((d) => (
              <button
                key={d.key}
                onClick={() => handleDivisionFilterChange(d.key)}
                style={{
                  padding: '4px 9px', borderRadius: 8,
                  background: divisionFilter === d.key ? 'rgba(15,23,42,0.08)' : 'transparent',
                  color: divisionFilter === d.key ? '#0F172A' : '#94A3B8',
                  border: '1px solid rgba(15,23,42,0.1)',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap' as const,
                  flexShrink: 0,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Club search bar */}
        {arenaMode === 'club' && (
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <ClubSearchBar
              selectedClubId={selectedClubId}
              selectedClubName={selectedClubName}
              userHomeClubId={userHomeClubId}
              userHomeClubName={userHomeClubName}
              onClubSelect={handleClubSelect}
            />
          </div>
        )}

        {/* Country selector */}
        {arenaMode === 'country' && (
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
            />
          </div>
        )}

        {/* Active filter pill */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: 6 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(247,147,30,0.12)',
              border: '1px solid rgba(247,147,30,0.35)',
              fontSize: 10, fontWeight: 800, color: '#9A4A0F',
              letterSpacing: '0.04em',
            }}>
              <span>Filtering by {activeFilterLabel || '…'}</span>
              <button
                onClick={handleResetFilters}
                aria-label="Clear filters"
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: '#9A4A0F', fontSize: 11, fontWeight: 800, lineHeight: 1,
                }}
              >
                ✕ clear
              </button>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '26px 38px 1fr 36px 50px',
          padding: '10px 0 8px',
          borderBottom: '1px solid #0F172A',
          fontSize: 9, fontWeight: 800, color: '#94A3B8',
          letterSpacing: '0.18em', alignItems: 'center',
        }}>
          <span>POS</span>
          <span />
          <span>PLAYER</span>
          <span style={{ textAlign: 'right' }}>{timeFilter === 'all_time' ? 'DIV' : 'WK'}</span>
          <span style={{ textAlign: 'right' }}>CRS</span>
        </div>

        {/* Loading state (initial) */}
        {leaderboardLoading && allEntries.length === 0 && (
          <div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26px 38px 1fr 36px 50px',
                  alignItems: 'center', padding: '12px 0',
                  borderBottom: '1px solid rgba(15,23,42,0.07)',
                }}
              >
                <Skeleton style={{ height: 14, width: 18 }} />
                <Skeleton style={{ height: 30, width: 30, borderRadius: 3 }} />
                <Skeleton style={{ height: 14, width: '60%' }} />
                <Skeleton style={{ height: 12, width: 24, marginLeft: 'auto' }} />
                <Skeleton style={{ height: 18, width: 32, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}

        {/* Initial error */}
        {isError && allEntries.length === 0 && !leaderboardLoading && (
          <InitialErrorState onRetry={() => refetch()} />
        )}

        {/* Empty state */}
        {!leaderboardLoading && !isError && allEntries.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#94A3B8', fontStyle: 'italic', marginBottom: 14 }}>
              {arenaMode === 'friends'
                ? 'No friends on the leaderboard yet.'
                : arenaMode === 'club'
                  ? 'No members from this club have entered yet.'
                  : 'No entrants in this view yet.'}
            </p>
            {arenaMode === 'friends' && (
              <button
                onClick={() => navigate('/golfers-to-follow')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, color: '#9F1D1D',
                  letterSpacing: '0.18em',
                }}
              >
                FIND FRIENDS →
              </button>
            )}
          </div>
        )}

        {/* Player rows */}
        {allEntries.map((p, i) => {
          const isLast = i === allEntries.length - 1;
          const showStreak = timeFilter === 'seasonal' && p.streak_current >= 3;

          // ── Chaser strip values (only for current user) ──
          let chaserAbove: number | null = null;
          let chaserBelow: number | null = null;
          if (p.is_current_user && i > 0 && i < allEntries.length - 1) {
            const above = allEntries[i - 1];
            const below = allEntries[i + 1];
            if (above && below) {
              chaserAbove = Math.max(0, above.courses_this_season - p.courses_this_season);
              chaserBelow = Math.max(0, p.courses_this_season - below.courses_this_season);
            }
          }
          const showChaserStrip = chaserAbove !== null && chaserBelow !== null && (chaserAbove > 0 || chaserBelow > 0);

          return (
            <div
              key={p.user_id}
              onClick={() => handleEntryClick(p.user_id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '26px 38px 1fr 36px 50px',
                alignItems: 'center',
                gap: 4,
                padding: '12px 0',
                borderBottom: isLast
                  ? '1px solid #0F172A'
                  : '1px solid rgba(15,23,42,0.07)',
                background: p.is_current_user ? 'rgba(159,29,29,0.04)' : 'transparent',
                marginLeft: p.is_current_user ? -10 : 0,
                marginRight: p.is_current_user ? -10 : 0,
                paddingLeft: p.is_current_user ? 10 : 0,
                paddingRight: p.is_current_user ? 10 : 0,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {p.is_current_user && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 3, background: '#9F1D1D',
                }} />
              )}

              <span style={{
                fontSize: 18, fontWeight: 900,
                color: p.current_rank <= 3 ? '#0F172A' : '#94A3B8',
                fontVariantNumeric: 'tabular-nums lining-nums',
                letterSpacing: '-0.02em',
              }}>
                {p.current_rank}
              </span>

              <div
                style={{
                  width: 30,
                  aspectRatio: '1 / 1.05',
                  borderRadius: '34%',
                  overflow: 'hidden',
                  border: p.is_current_user
                    ? '0.5px solid #9F1D1D'
                    : '0.5px solid rgba(15,23,42,0.18)',
                  background: '#fff',
                }}
              >
                <SquircleAvatar
                  src={p.avatar_url}
                  alt={p.display_name}
                  userId={p.user_id}
                  size={30}
                  hideRing
                />
              </div>

              <div style={{ minWidth: 0, paddingLeft: 4 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: '#0F172A',
                  letterSpacing: '-0.005em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.display_name}
                  {p.is_current_user && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: '#9F1D1D',
                      letterSpacing: '0.18em', marginLeft: 6,
                    }}>YOU</span>
                  )}
                </div>
                <div style={{
                  fontSize: 11, color: '#94A3B8', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.home_club || 'Independent'}
                  {showStreak && (
                    <span style={{ color: '#9F1D1D', fontWeight: 700, marginLeft: 4 }}>
                      · {p.streak_current}w streak
                    </span>
                  )}
                </div>
              </div>

              {timeFilter === 'seasonal' ? (
                <span style={{
                  textAlign: 'right', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  color: p.rank_movement > 0
                    ? '#15803D'
                    : p.rank_movement < 0
                      ? '#9F1D1D'
                      : '#CBD5E1',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}>
                  {p.rank_movement > 0
                    ? `↑${p.rank_movement}`
                    : p.rank_movement < 0
                      ? `↓${Math.abs(p.rank_movement)}`
                      : '—'}
                </span>
              ) : (
                <span style={{
                  textAlign: 'right', fontSize: 10, fontWeight: 800,
                  color: '#64748B', letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}>
                  {abbreviateDivision(p.division_slug) || '—'}
                </span>
              )}

              <span style={{
                fontSize: 22, fontWeight: 900, textAlign: 'right',
                color: '#0F172A', letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}>
                {p.courses_this_season}
              </span>

              {showChaserStrip && (
                <div style={{
                  gridColumn: '1 / -1',
                  marginTop: 8,
                  height: 4,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'stretch',
                }}>
                  <div style={{
                    flex: Math.min(chaserAbove ?? 0, 6),
                    background: 'rgba(159,29,29,0.30)',
                    borderRadius: 1,
                    minWidth: chaserAbove === 0 ? 4 : 8,
                  }} />
                  <div style={{
                    width: 6,
                    background: '#9F1D1D',
                    borderRadius: 1,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    flex: Math.min(chaserBelow ?? 0, 6),
                    background: 'rgba(15,23,42,0.15)',
                    borderRadius: 1,
                    minWidth: chaserBelow === 0 ? 4 : 8,
                  }} />
                </div>
              )}
            </div>
          );
        })}

        {/* Sentinel + footer feedback */}
        {hasNextPage && !isError && (
          <div ref={sentinelRef} style={{ padding: '12px 0' }}>
            {isFetchingNextPage && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, color: '#94A3B8', fontSize: 12,
              }}>
                <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                <span style={{ letterSpacing: '0.12em', fontWeight: 700 }}>LOADING</span>
              </div>
            )}
          </div>
        )}

        {isError && allEntries.length > 0 && !isFetchingNextPage && (
          <InlineRetryCard onRetry={() => fetchNextPage()} />
        )}
      </div>

      {/* ── 8. FOOTER CAPTION ── */}
      <div style={{ padding: '20px 20px 28px', textAlign: 'center' }}>
        <div style={{
          fontSize: 10, color: '#94A3B8', letterSpacing: '0.06em', fontStyle: 'italic',
        }}>
          Compiled from members' verified course visits · Updated daily
        </div>
      </div>

      {/* Sponsor link sheet */}
      {season?.sponsor_url && (
        <ExternalLinkSheet
          isOpen={showSponsorSheet}
          onClose={() => setShowSponsorSheet(false)}
          url={season.sponsor_url}
          title={season.sponsor_name || 'Sponsor'}
        />
      )}

      {/* Lede explainer sheet */}
      <BottomSheet
        open={showLedeInfoSheet}
        onClose={() => setShowLedeInfoSheet(false)}
        zIndexBase={1500}
        className="!rounded-t-[24px]"
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '12px 20px 28px', background: '#fff' }}>
          <div style={{
            width: 36, height: 4, borderRadius: 999,
            background: 'rgba(15,23,42,0.18)',
            margin: '0 auto 16px',
          }} />
          <div style={{
            fontSize: 18, fontWeight: 900, color: '#0F172A',
            letterSpacing: '-0.01em', marginBottom: 8,
          }}>
            Why this headline
          </div>
          <p style={{
            fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0,
            marginBottom: 16,
          }}>
            Our editorial AI tailors the headline to your position in the standings, the season's pace, and how your week is going.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentUserEntry?.current_rank != null && (
              <LedeFactor
                label="Your rank"
                value={`#${currentUserEntry.current_rank}`}
              />
            )}
            {timeFilter === 'seasonal' && season && daysRemaining > 0 && (
              <LedeFactor
                label="Days remaining"
                value={`${daysRemaining}d`}
              />
            )}
            {currentUserEntry?.rank_movement != null && currentUserEntry.rank_movement !== 0 && (
              <LedeFactor
                label="Weekly movement"
                value={
                  currentUserEntry.rank_movement > 0
                    ? `Up ${currentUserEntry.rank_movement} this week`
                    : `Down ${Math.abs(currentUserEntry.rank_movement)} this week`
                }
              />
            )}
          </div>

          <div style={{
            marginTop: 16, paddingTop: 12,
            borderTop: '1px solid rgba(15,23,42,0.08)',
            fontSize: 10, color: '#94A3B8', letterSpacing: '0.06em',
            fontStyle: 'italic', textAlign: 'center',
          }}>
            Headline by Editorial AI · Updated daily
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
