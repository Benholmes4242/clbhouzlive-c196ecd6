import React, { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Building2, RefreshCw, WifiOff } from 'lucide-react';

import {
  useChampionshipLeaderboard,
  useUserChampionshipStatus,
  useUserRivals,
  useDivisionConfig,
  useSeasonCalendar,
} from '@/hooks/championship';
import { useArenaRanks } from '@/hooks/championship/useArenaRanks';
import {
  ChampionshipFilters,
  BeatRivalCTA,
  RivalVersusPanel,
} from './modules';
import { TrophyPodium } from './podium/TrophyPodium';
import { HallOfFamePodium } from './podium/HallOfFamePodium';
import { usePodiumSeasonal } from '@/hooks/championship/usePodiumSeasonal';
import { usePodiumAllTime } from '@/hooks/championship/usePodiumAllTime';
import { SeasonStatusPanel } from './season-status';
import { TimeModeToggle } from './TimeModeToggle';
import { DivisionLadderPanel } from './DivisionLadderPanel';
import { DivisionProgressPreview } from './DivisionProgressPreview';
import { LeaderboardRowV3 } from './LeaderboardRowV3';
import { RankCelebration } from './RankCelebration';
import { MotivationalCarousel } from './MotivationalCarousel';
import { SeasonRaceCard } from './SeasonRaceCard';
import { ArenasStrip } from './ArenasStrip';
import { SeasonWinnerCard } from './SeasonWinnerCard';
// HallOfFameHeader is now integrated into HallOfFamePodium
import { ClubSearchBar } from '@/components/leaderboards/exploration/ClubSearchBar';
import { CountrySelector } from '@/components/leaderboards/shared/CountrySelector';
import { Skeleton } from '@/components/ui/skeleton';
import { getSeasonConfig, SEASON_ORDER, type SeasonId } from '@/lib/seasonConfig';
import type { ChampionshipArenaMode, DivisionSlug, UserRival } from '@/types/championship';
import { DIVISION_ORDER, getDivisionIndex } from '@/types/championship';
import type { TimeFilter, PodiumScope } from '@/types/podium';
import { TIER_CONFIG } from '@/lib/clbhouzAchievementPalette';
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

// ─── Inline sub-components ──────────────────────────────────────────

const LeaderboardLoadingSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
        <Skeleton className="w-7 h-7 rounded" />
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-10 h-8 rounded" />
      </div>
    ))}
  </div>
);

const InlineRetryCard = ({ onRetry }: { onRetry: () => void }) => (
  <div className="max-w-md mx-auto mt-4">
    <button
      onClick={onRetry}
      className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-sq-sm bg-card border border-border text-sm text-muted-foreground transition-colors active:scale-[0.98] active:opacity-70"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Couldn't load more entries · Tap to retry
    </button>
  </div>
);

const InitialErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <WifiOff className="w-12 h-12 text-muted-foreground/40 mb-4" />
    <p className="text-foreground font-semibold mb-1">Unable to load leaderboard</p>
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
const ROW_HEIGHT = 72; // 64px row (p-3 + h-10 avatar) + 8px gap (space-y-2)
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8; // Buffer rows above/below viewport

interface ChampionshipLeaderboardViewProps {
  className?: string;
}

/**
 * ChampionshipLeaderboardView - Main orchestrator for Championship Mode.
 * Simplified version with SeasonHubBanner, SimplePodium, and LeaderboardRowV3.
 */
export function ChampionshipLeaderboardView({ className }: ChampionshipLeaderboardViewProps) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const userId = user?.id;

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
  
  // UI state
  const [showDivisionLadder, setShowDivisionLadder] = useState(false);
  const [selectedRival, setSelectedRival] = useState<UserRival | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [userHandicap, setUserHandicap] = useState<number | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Club-related state (restored from persistence)
  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.clubId ?? null;
  });
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  
  // Country-related state (restored from persistence)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
    const saved = readSavedFilters();
    return saved?.country ?? null;
  });

  // Scroll position preservation refs for filter changes
  const scrollPositionRef = useRef<number>(0);
  const isFilterChangeRef = useRef<boolean>(false);

  // Infinite scroll refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  // ─── Virtualization state ─────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // ─── Filter persistence effect ────────────────────────────────────
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

  // Fetch user's home club, handicap, and country
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country, eg_handicap_index, golf_clubs!user_profiles_primary_club_id_fkey(id, name, country)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      const clubData = Array.isArray(data.golf_clubs) ? data.golf_clubs[0] : data.golf_clubs;
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName(clubData?.name || null);
      }
      // Country: prefer home club's country (matches gc.country in RPC filter).
      // Fall back to user_profiles.country for users without a home club.
      const clubCountry = (clubData as any)?.country ?? null;
      const profileCountry = (data as any)?.country ?? null;
      setUserCountry(clubCountry || profileCountry || null);
      setUserHandicap((data as any)?.eg_handicap_index ?? null);
    };

    fetchUserProfile();
  }, [userId]);

  // Auto-select home club when switching to club mode
  useEffect(() => {
    if (arenaMode === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [arenaMode, selectedClubId, userHomeClubId, userHomeClubName]);

  // Clear country when switching away from country mode
  useEffect(() => {
    if (arenaMode !== 'country') {
      setSelectedCountry(null);
    }
  }, [arenaMode]);

  // Handle club selection
  const handleClubSelect = useCallback((clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  }, []);

  // Convert arenaMode to PodiumScope
  const podiumScope: PodiumScope = arenaMode;
  const podiumMode = timeFilter === 'seasonal' ? 'seasonal' : 'all_time';

  // Compute clubId for queries - only pass when in club mode
  const queryClubId = arenaMode === 'club' ? selectedClubId : null;
  // Compute country for queries - only pass when in country mode
  const queryCountry = arenaMode === 'country' ? selectedCountry : null;

  // Data fetching
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    isError,
    error: leaderboardError,
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

  const { data: userStatus, isLoading: statusLoading } = useUserChampionshipStatus(userId);
  const { data: rivals, isLoading: rivalsLoading } = useUserRivals(userId, 5);
  const { data: divisions } = useDivisionConfig();
  const { data: seasonCalendar } = useSeasonCalendar();

  // Arena ranks for the ArenasStrip
  const { data: arenaRanks } = useArenaRanks(
    userId,
    userCountry,
    userHomeClubId,
    userHandicap,
  );

  // Podium data fetching
  const { data: seasonalPodiumData } = usePodiumSeasonal({
    scope: podiumScope,
    divisionId: divisionFilter !== 'all' ? divisionFilter : undefined,
    clubId: queryClubId,
    country: queryCountry,
    currentUserId: userId,
    enabled: timeFilter === 'seasonal',
  });

  const { data: allTimePodiumData } = usePodiumAllTime({
    scope: podiumScope,
    clubId: queryClubId,
    country: queryCountry,
    currentUserId: userId,
    enabled: timeFilter === 'all_time',
  });

  // Transform podium data for TrophyPodium
  const podiumEntries = useMemo(() => {
    if (timeFilter !== 'seasonal' || !seasonalPodiumData) return [];
    return seasonalPodiumData;
  }, [timeFilter, seasonalPodiumData]);

  // Flatten paginated entries — memoized for stable reference
  const allEntries = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.entries) ?? [];
  }, [leaderboardData?.pages]);

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
    if (allEntries.length < VIRTUALIZATION_THRESHOLD) return;

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
  }, [allEntries.length]);

  // ─── Scroll position save/restore ─────────────────────────────────
  const handleEntryClick = useCallback((clickedUserId: string) => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
    navigate(`/profile/${clickedUserId}?tab=top100`);
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

  // Get current season from calendar
  const currentSeason = useMemo(() => {
    return seasonCalendar?.find(s => s.is_current) ?? null;
  }, [seasonCalendar]);

  // Map season name to SeasonId for the new SeasonStatusPanel
  const mapToSeasonId = (name: string): SeasonId => {
    const lower = name.toLowerCase();
    if (lower.includes('pre-season') || lower.includes('preseason') || lower.includes('training')) return 'preseason';
    if (lower.includes('major')) return 'major';
    if (lower.includes('summer')) return 'summer';
    if (lower.includes('off-season') || lower.includes('offseason')) return 'offseason';
    return 'preseason';
  };

  // Prepare data for SeasonStatusPanel
  const currentSeasonId = useMemo<SeasonId>(() => {
    if (!currentSeason) return 'preseason';
    return mapToSeasonId(currentSeason.name);
  }, [currentSeason]);

  // Get current season theme color for podium (must be after currentSeasonId)
  const seasonThemeColor = useMemo(() => {
    const config = getSeasonConfig(currentSeasonId);
    return config.themeColor;
  }, [currentSeasonId]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!currentSeason) return 0;
    const startDate = new Date(currentSeason.start_date);
    const endDate = new Date(currentSeason.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = currentSeason.days_remaining ?? 0;
    return daysRemaining > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100;
  }, [currentSeason]);

  // Build seasonData for chips (days until available for locked seasons)
  const seasonData = useMemo<Record<SeasonId, { daysUntilAvailable?: number }>>(() => {
    const data: Record<SeasonId, { daysUntilAvailable?: number }> = {
      preseason: {},
      major: {},
      summer: {},
      offseason: {},
    };
    
    if (!seasonCalendar) return data;
    
    seasonCalendar.forEach(s => {
      const id = mapToSeasonId(s.name);
      if (s.days_until_start && s.days_until_start > 0) {
        data[id].daysUntilAvailable = s.days_until_start;
      }
    });
    
    return data;
  }, [seasonCalendar]);

  // Completed seasons with winners (for SeasonWinnerCard in all-time mode)
  const completedSeasonsWithWinners = useMemo(() => {
    if (!seasonCalendar) return [];
    return seasonCalendar
      .filter(s => s.status === 'completed' && s.season_winner_user_id)
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  }, [seasonCalendar]);

  // Fetch winner profiles for completed seasons
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, { display_name: string; avatar_url: string | null; club_name: string | null }>>({});

  useEffect(() => {
    const fetchWinnerProfiles = async () => {
      const winnerIds = completedSeasonsWithWinners
        .map(s => s.season_winner_user_id)
        .filter((id): id is string => !!id);
      
      if (winnerIds.length === 0) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, golf_clubs!user_profiles_primary_club_id_fkey(name)')
        .in('id', winnerIds);

      if (data) {
        const profiles: typeof winnerProfiles = {};
        data.forEach((p: any) => {
          const clubData = Array.isArray(p.golf_clubs) ? p.golf_clubs[0] : p.golf_clubs;
          profiles[p.id] = {
            display_name: p.display_name || 'Champion',
            avatar_url: p.avatar_url,
            club_name: clubData?.name || null,
          };
        });
        setWinnerProfiles(profiles);
      }
    };

    fetchWinnerProfiles();
  }, [completedSeasonsWithWinners]);


  const currentUserEntry = useMemo(() => {
    return allEntries.find(e => e.is_current_user) || null;
  }, [allEntries]);

  const currentRank = currentUserEntry?.current_rank || null;
  const isInTop10 = currentRank !== null && currentRank <= 10;
  const isInTop3 = currentRank !== null && currentRank <= 3;

  const friendAhead = null;
  const friendBehind = null;

  // Get closest rival who is ahead
  const closestRivalAhead = useMemo(() => {
    if (!rivals?.length) return null;
    return rivals.find(r => r.gap > 0) || null;
  }, [rivals]);

  // Derive handicap from currentUserEntry if available
  // userHandicap is now set from profile fetch (eg_handicap_index) — more reliable than leaderboard entry

  // Helper: country flag emoji
  const getCountryFlag = (country: string): string => {
    const flags: Record<string, string> = {
      'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'ireland': '🇮🇪', 'united states': '🇺🇸', 'usa': '🇺🇸', 'canada': '🇨🇦',
      'australia': '🇦🇺', 'france': '🇫🇷', 'germany': '🇩🇪', 'spain': '🇪🇸',
      'portugal': '🇵🇹', 'italy': '🇮🇹', 'japan': '🇯🇵', 'south korea': '🇰🇷',
      'sweden': '🇸🇪', 'norway': '🇳🇴', 'denmark': '🇩🇰', 'netherlands': '🇳🇱',
      'south africa': '🇿🇦', 'new zealand': '🇳🇿', 'united kingdom': '🇬🇧',
    };
    return flags[country.toLowerCase()] || '🏳️';
  };

  // Helper: handicap band label
  const getHandicapBandLabel = (hcp: number | null): string => {
    if (hcp === null) return 'Handicap';
    const low = Math.floor(hcp - 1.5);
    const high = Math.ceil(hcp + 1.5);
    return `Hdcp ${low}–${high}`;
  };

  const handleLogCourse = () => {
    navigate('/courses');
  };

  const handleUserClick = (clickedUserId: string) => {
    navigate(`/golfer/${clickedUserId}`);
  };

  // Scroll-preserving filter handlers - capture scroll before state change
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
  }, [arenaMode, divisionFilter, allEntries]);


  // Build division ladder data
  const divisionLadderData = useMemo(() => {
    if (!divisions || !userStatus) return [];
    
    const currentIndex = getDivisionIndex(userStatus.division_slug);
    
    return divisions
      .sort((a, b) => a.tier_order - b.tier_order)
      .map((div, index) => {
        let status: 'locked' | 'current' | 'next' | 'completed' = 'locked';
        if (index < currentIndex) status = 'completed';
        else if (index === currentIndex) status = 'current';
        else if (index === currentIndex + 1) status = 'next';
        
        return {
          id: div.id,
          name: div.name,
          threshold: div.min_courses,
          color: div.color_hex,
          status,
        };
      });
  }, [divisions, userStatus]);

  // Get next division info
  const nextDivision = useMemo(() => {
    if (!userStatus) return { name: 'Next Division', coursesToNext: 0 };
    const currentIndex = getDivisionIndex(userStatus.division_slug);
    const nextSlug = DIVISION_ORDER[currentIndex + 1];
    const tierValues = Object.values(TIER_CONFIG);
    const nextConfig = nextSlug 
      ? tierValues.find(t => t.name?.toLowerCase().includes(nextSlug.replace('-club', '').replace('_', ' ')))
      : null;
    return {
      name: nextConfig?.name || 'Max Division',
      coursesToNext: userStatus.courses_to_next_division || 0,
    };
  }, [userStatus]);

  // ─── Virtualized list rendering ───────────────────────────────────
  const useVirtualization = allEntries.length >= VIRTUALIZATION_THRESHOLD;

  const virtualizedContent = useMemo(() => {
    if (!useVirtualization) return null;

    // Calculate the offset of the list container from the top of the page
    // We approximate — the list starts after podium, filters, etc.
    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);

    const totalHeight = allEntries.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(window.innerHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(allEntries.length, startIndex + visibleCount);

    const visibleEntries = allEntries.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    return { totalHeight, visibleEntries, offsetY, startIndex };
  }, [useVirtualization, allEntries, scrollTop]);

  return (
    <div className={cn('flex flex-col px-5 py-5', className)} style={{ gap: 20 }}>
      {/* 1. Season Status Panel — floats on page background, no card wrapper */}
      {timeFilter === 'seasonal' && currentSeason && (
        <SeasonStatusPanel
          currentSeasonId={currentSeasonId}
          daysRemaining={currentSeason.days_remaining ?? 0}
          progressPercent={progressPercent}
          seasonData={seasonData}
          isLoading={!seasonCalendar}
          onSeasonClick={(id) => console.log('Season chip clicked:', id)}
          seasonColor={seasonThemeColor}
          sponsorName={currentSeason.sponsor_name ?? null}
          prizeDescription={currentSeason.prize_description ?? null}
          leaderCourses={allEntries[0]?.courses_this_season ?? 0}
          yourCourses={currentUserEntry?.courses_this_season ?? 0}
          yourSeasonRank={currentUserEntry?.current_rank ?? 0}
          totalSeasonPlayers={allEntries.length}
        />
      )}

      {/* 1b. Season Race Card — live position in season race */}
      {timeFilter === 'seasonal' && currentSeason && (currentUserEntry?.courses_this_season ?? 0) > 0 && (
        <SeasonRaceCard
          seasonLabel={getSeasonConfig(currentSeasonId).title}
          seasonColor={seasonThemeColor}
          yourCourses={currentUserEntry?.courses_this_season ?? 0}
          leaderCourses={allEntries[0]?.courses_this_season ?? 0}
          yourRank={currentUserEntry?.current_rank ?? 0}
          totalPlayers={allEntries.length}
          daysRemaining={currentSeason.days_remaining ?? 0}
          majorsBonusActive={currentSeasonId === 'major'}
        />
      )}

      {/* 2. Time Filter Toggle */}
      <div>
        <TimeModeToggle
          value={timeFilter}
          onChange={setTimeFilter}
          seasonYear={currentSeason ? new Date(currentSeason.start_date).getFullYear() : undefined}
        />
      </div>

      {/* 3. Podium - Show Trophy Podium for seasonal, Hall of Fame for all-time */}
      <div className="overflow-visible">
        {timeFilter === 'seasonal' && podiumEntries.length > 0 && (
          <TrophyPodium
            entries={podiumEntries}
            seasonThemeColor={seasonThemeColor}
            currentUserId={userId}
            onUserClick={handleUserClick}
          />
        )}
        {timeFilter === 'all_time' && completedSeasonsWithWinners.length > 0 && (
          <div className="space-y-4 mb-4">
            {completedSeasonsWithWinners.map(season => {
              const winnerId = season.season_winner_user_id!;
              const profile = winnerProfiles[winnerId];
              const seasonId = mapToSeasonId(season.name);
              const config = getSeasonConfig(seasonId);
              return (
                <SeasonWinnerCard
                  key={season.season_id}
                  seasonLabel={config.title}
                  winnerName={profile?.display_name || 'Champion'}
                  winnerAvatarUrl={profile?.avatar_url}
                  winnerClubName={profile?.club_name}
                  winnerCourses={season.season_winner_courses ?? 0}
                  sponsorName={season.sponsor_name}
                  prizeDescription={season.prize_description}
                  prizeClaimed={season.prize_claimed}
                  endDate={season.end_date}
                />
              );
            })}
          </div>
        )}
        {timeFilter === 'all_time' && allTimePodiumData && allTimePodiumData.length > 0 && (
          <HallOfFamePodium
            entries={allTimePodiumData}
            currentUserId={userId}
            onUserClick={handleUserClick}
          />
        )}
      </div>

      {/* 4. Beat Rival CTA */}
      {closestRivalAhead && (
        <BeatRivalCTA 
          rival={closestRivalAhead} 
          onLogCourse={handleLogCourse} 
        />
      )}

      {/* 5. Division Progress Preview & Ladder (collapsible) - Only in seasonal mode */}
      {timeFilter === 'seasonal' && divisionLadderData.length > 0 && userStatus && (
        <>
          <DivisionProgressPreview
            currentDivision={divisionLadderData.find(d => d.status === 'current') || null}
            nextDivision={divisionLadderData.find(d => d.status === 'next') || null}
            coursesToNext={userStatus.courses_to_next_division || 0}
            userCourses={userStatus.courses_this_season || 0}
            isExpanded={showDivisionLadder}
            onToggle={() => setShowDivisionLadder(!showDivisionLadder)}
            totalDivisions={divisionLadderData.length}
            completedCount={divisionLadderData.filter(d => d.status === 'completed').length}
            seasonColor={seasonThemeColor}
          />
          
          {/* Full Division Ladder (expandable with animation) */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              showDivisionLadder ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <DivisionLadderPanel
              divisions={divisionLadderData}
              userCourses={userStatus.courses_this_season}
              coursesToNext={nextDivision.coursesToNext}
              nextDivisionName={nextDivision.name}
              seasonColor={seasonThemeColor}
            />
          </div>
        </>
      )}

      {/* 6. Motivational Carousel - Only show in Season mode */}
      {timeFilter === 'seasonal' && currentUserEntry && (
        <MotivationalCarousel
          currentRank={currentRank}
          totalPlayers={allEntries.length}
          coursesThisSeason={currentUserEntry.courses_this_season}
          friendAhead={friendAhead ? {
            name: friendAhead.display_name?.split(' ')[0] || 'Friend',
            rank: friendAhead.current_rank,
            coursesAhead: friendAhead.courses_this_season - currentUserEntry.courses_this_season,
          } : null}
          friendBehind={friendBehind ? {
            name: friendBehind.display_name?.split(' ')[0] || 'Friend',
            rank: friendBehind.current_rank,
            coursesBehind: currentUserEntry.courses_this_season - friendBehind.courses_this_season,
          } : null}
          rivalAhead={closestRivalAhead ? {
            name: closestRivalAhead.display_name?.split(' ')[0] || 'Rival',
            rank: closestRivalAhead.current_rank ?? 0,
            coursesAhead: closestRivalAhead.gap ?? 0,
          } : null}
          coursesToNextRank={userStatus?.courses_to_next_division}
          isInTop10={isInTop10}
          isInTop3={isInTop3}
          streak={undefined}
        />
      )}

      {/* 6b. Arenas Strip — rank pills */}
      {timeFilter === 'seasonal' && currentUserEntry && (
        <ArenasStrip
          activeArena={arenaMode}
          onArenaChange={handleArenaModeChange}
          globalRank={currentUserEntry.current_rank ?? null}
          globalTotal={allEntries.length}
          countryRank={arenaRanks?.countryRank ?? null}
          countryLabel={userCountry || 'Country'}
          countryFlag={userCountry ? getCountryFlag(userCountry) : '🏳️'}
          countryTotal={arenaRanks?.countryTotal ?? 0}
          clubRank={arenaRanks?.clubRank ?? null}
          clubLabel={userHomeClubName || 'My Club'}
          clubTotal={arenaRanks?.clubTotal ?? 0}
          handicapRank={arenaRanks?.handicapRank ?? null}
          handicapLabel={getHandicapBandLabel(userHandicap)}
          handicapTotal={arenaRanks?.handicapTotal ?? 0}
          seasonLabel={getSeasonConfig(currentSeasonId).title}
        />
      )}

      {/* 7. Filters - Scope Toggle */}
      <div className="w-full">
        <ChampionshipFilters
          arenaMode={arenaMode}
          divisionFilter={divisionFilter}
          onArenaModeChange={handleArenaModeChange}
          onDivisionFilterChange={handleDivisionFilterChange}
        />
      </div>

      {/* 8. Club Search Bar (only when club mode is active) */}
      {arenaMode === 'club' && (
        <ClubSearchBar
          selectedClubId={selectedClubId}
          selectedClubName={selectedClubName}
          userHomeClubId={userHomeClubId}
          userHomeClubName={userHomeClubName}
          onClubSelect={handleClubSelect}
        />
      )}

      {/* 8b. Country Selector (only when country mode is active) */}
      {arenaMode === 'country' && (
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
        />
      )}

      {/* 9. Leaderboard List */}
      <div ref={listContainerRef} className="min-h-[400px] relative" style={{ overflowAnchor: 'auto' }}>
        {/* Loading overlay - doesn't unmount the list */}
        {leaderboardLoading && allEntries.length > 0 && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center py-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm border border-border/50">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Updating...</span>
            </div>
          </div>
        )}
        
        {/* Initial error state */}
        {isError && allEntries.length === 0 ? (
          <InitialErrorState onRetry={() => refetch()} />
        ) : leaderboardLoading && allEntries.length === 0 ? (
          // Initial loading skeleton
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-3 px-4 flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="w-11 h-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            ))}
          </div>
        ) : allEntries.length === 0 && !leaderboardLoading ? (
          // Contextual empty states based on arena mode
          arenaMode === 'friends' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No friends yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Follow golfers to see them on your friends leaderboard
              </p>
            </div>
          ) : arenaMode === 'club' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No club members found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                No members from this club have joined the championship yet
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No players found</p>
            </div>
          )
        ) : useVirtualization && virtualizedContent ? (
          // Virtualized list for large entry counts
          <div
            className={cn('relative transition-opacity duration-150', leaderboardLoading && 'opacity-60')}
            style={{ height: virtualizedContent.totalHeight }}
          >
            <div
              className="absolute inset-x-0 space-y-2"
              style={{ transform: `translateY(${virtualizedContent.offsetY}px)` }}
            >
              {virtualizedContent.visibleEntries.map((entry) => (
                <LeaderboardRowV3
                  key={entry.user_id}
                  rank={entry.current_rank}
                  name={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  homeClubName={entry.home_club}
                  courses={entry.courses_this_season}
                  isCurrentUser={entry.is_current_user}
                  seasonColor={timeFilter === 'seasonal' ? seasonThemeColor : 'hsl(var(--accent-amber))'}
                  onClick={() => handleEntryClick(entry.user_id)}
                />
              ))}
            </div>
          </div>
        ) : (
          // Non-virtualized list for smaller entry counts
          <div className={cn('transition-opacity duration-150 space-y-2', leaderboardLoading && 'opacity-60')}>
            {allEntries.map((entry) => (
              <LeaderboardRowV3
                key={entry.user_id}
                rank={entry.current_rank}
                name={entry.display_name}
                avatarUrl={entry.avatar_url}
                homeClubName={entry.home_club}
                courses={entry.courses_this_season}
                  isCurrentUser={entry.is_current_user}
                  seasonColor={timeFilter === 'seasonal' ? seasonThemeColor : 'hsl(var(--accent-amber))'}
                onClick={() => handleEntryClick(entry.user_id)}
              />
            ))}
          </div>
        )}
        
        {/* Short list invite CTA */}
        {allEntries.length > 0 && allEntries.length < 10 && !hasNextPage && !leaderboardLoading && (
          <div className="mt-6 mx-4 py-5 px-4 rounded-2xl flex flex-col items-center gap-2 text-center"
            style={{ border: '1.5px dashed hsl(var(--border) / 0.3)' }}
          >
            <p className="text-[14px] text-muted-foreground">
              Invite friends to climb the leaderboard
            </p>
            <button
              className="text-[14px] font-semibold transition-opacity active:scale-[0.97] active:opacity-70"
              style={{ color: 'hsl(var(--accent-amber))' }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Join me on Clbhouz', url: window.location.origin });
                }
              }}
            >
              Share Invite Link
            </button>
          </div>
        )}

        {/* Sentinel + loading skeleton for infinite scroll */}
        {hasNextPage && !isError && (
          <div ref={sentinelRef}>
            {isFetchingNextPage && <LeaderboardLoadingSkeleton />}
          </div>
        )}

        {/* Inline retry on pagination error */}
        {isError && !isFetchingNextPage && allEntries.length > 0 && (
          <InlineRetryCard onRetry={() => fetchNextPage()} />
        )}

        {/* Loading indicator during retry */}
        {isError && isFetchingNextPage && allEntries.length > 0 && (
          <LeaderboardLoadingSkeleton />
        )}
      </div>

      {/* Rival Versus Panel (drawer) */}
      {userStatus && selectedRival && (
        <RivalVersusPanel
          isOpen={!!selectedRival}
          onClose={() => setSelectedRival(null)}
          rival={selectedRival}
          userStatus={userStatus}
        />
      )}

      {/* Rank Celebration */}
      {previousRank && userStatus && (
        <RankCelebration 
          previousRank={previousRank}
          currentRank={userStatus.current_rank}
          show={showCelebration}
          onComplete={() => {
            setShowCelebration(false);
            setPreviousRank(null);
          }}
        />
      )}

    </div>
  );
}
