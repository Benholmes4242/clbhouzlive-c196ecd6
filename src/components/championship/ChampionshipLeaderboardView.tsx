import { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ExternalLinkSheet } from '@/components/shared/ExternalLinkSheet';
import { getProfilePathById } from '@/lib/profileRoutes';

import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useSeasonCalendar,
  useDailyEditorial,
} from '@/hooks/championship';
import type { EditorialCopy } from '@/hooks/championship/useDailyEditorial';
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

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const FALLBACK_PALETTE = ['#1F2937', '#334155', '#475569', '#5B6470', '#3F4A55', '#2C3540', '#404B58', '#525E6B'];
function getAvatarFallbackColor(userId: string | null | undefined): string {
  if (!userId) return FALLBACK_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
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
      standfirst: `${args.leaderName || 'The leader'} sits atop the Clbhouz record with ${args.leaderCourses} courses played to date.`,
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

  // ─── Scroll save/restore ─────────────────────────────────────────
  const handleEntryClick = useCallback((clickedUserId: string) => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
    navigate(getProfilePathById(clickedUserId) + '?tab=top100');
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
  const arenas: { key: ChampionshipArenaMode; label: string }[] = [
    { key: 'global', label: 'Global' },
    { key: 'division', label: 'Division' },
    { key: 'friends', label: 'Friends' },
    { key: 'club', label: 'Club' },
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

      {/* ── 3. FRONT-PAGE LEDE ── */}
      {editorialPending ? (
        <EditorialLedeSkeleton />
      ) : (
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.28em',
            color: '#9F1D1D', marginBottom: 10,
          }}>
            {personalisedEyebrow}
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
              fontSize: 9, fontWeight: 800, color: '#94A3B8',
              letterSpacing: '0.18em', marginBottom: 4,
            }}>
              GAP
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1, color: '#0F172A',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}>
              {gap === null ? '—' : userIsLeader ? `+${gap}` : `−${gap}`}
            </div>
          </div>
        </div>
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 18, height: 1, background: '#0F172A' }} />
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em',
            }}>SCHEDULE</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 18, height: 1, background: '#0F172A' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#0F172A', letterSpacing: '0.22em',
          }}>
            {timeFilter === 'all_time' ? 'ALL-TIME STANDINGS' : 'FULL STANDINGS'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Arena tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {arenas.map((a) => (
            <button
              key={a.key}
              onClick={() => handleArenaModeChange(a.key)}
              style={{
                padding: '5px 10px', borderRadius: 8,
                background: arenaMode === a.key ? '#0F172A' : 'transparent',
                color: arenaMode === a.key ? '#fff' : '#64748B',
                border: arenaMode === a.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Division sub-filter */}
        {arenaMode === 'division' && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, marginTop: 8,
          }}>
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
          const initials = getInitials(p.display_name);

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

              {p.avatar_url ? (
                <SquircleAvatar
                  src={p.avatar_url}
                  alt={p.display_name}
                  size={30}
                  fallback={initials}
                />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: 3,
                  background: getAvatarFallbackColor(p.user_id),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 800,
                  border: p.is_current_user
                    ? '1.5px solid #9F1D1D'
                    : '1px solid rgba(15,23,42,0.08)',
                }}>
                  {initials}
                </div>
              )}

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
          Compiled from members' verified rounds · Updated daily
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
    </div>
  );
}
