/**
 * PlayersTab - Redesigned Players page.
 * Aligned with Tour Overview audit spacing & typography.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronDown, ChevronLeft, RefreshCw, Globe, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useTourSeasonRankings } from '../../hooks/useTourSeasonRankings';
import { PlayersHero } from '../players/PlayersHero';
import { type PlayerTourCode } from '../players/PlayersTourFilterSheet';
import { type PlayerSortType, getDefaultSortForTour } from '../players/PlayerSortControl';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { PlayersEmptyState } from '../players/PlayersEmptyState';
import { PlayersWorldsBest } from '../players/PlayersWorldsBest';
import { BottomSheet } from '@/components/ui/BottomSheet';

// Inline sort label resolver — mirrors PlayerSortControl's SORT_OPTIONS logic
function getSortShortLabel(sort: PlayerSortType, activeTour: string): string {
  const map: Record<string, string> = {
    'world-rank-desc': 'World Ranking',
    'world-rank-asc': 'World Ranking ↑',
    'alpha-az': 'A–Z',
    'alpha-za': 'Z–A',
    'most-wins': 'Wins',
    'highest-earnings': 'Earnings',
    'race-to-dubai': 'Race to Dubai',
    'race-to-cme': 'Race to CME Globe',
    'points-list': 'Points List',
    'liv-standings': 'Standings',
  };
  return map[sort] ?? 'Sort';
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debounced;
}

const PAGE_SIZE = 50;

export function PlayersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const initialTour = searchParams.get('tour') || 'all';
  const [sort, setSort] = useState<PlayerSortType>(getDefaultSortForTour(initialTour));
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tourSheetOpen, setTourSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Scroll position handled by centralized ScrollRestoration component

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'players'] }),
      queryClient.invalidateQueries({ queryKey: ['elite-players'] }),
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'player-statistics'] }),
      queryClient.invalidateQueries({ queryKey: ['tour-season-rankings'] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      handleRefresh();
    }
    setPullDistance(0);
    isPulling.current = false;
  }, [pullDistance, handleRefresh]);

  // Tour filter from URL
  const activeTour = (searchParams.get('tour') as PlayerTourCode) || 'all';
  const setActiveTour = useCallback((tour: PlayerTourCode) => {
    const params = new URLSearchParams(searchParams);
    if (tour === 'all') {
      params.delete('tour');
    } else {
      params.set('tour', tour);
    }
    params.set('tab', 'players');
    setSearchParams(params, { replace: true });
    setVisibleCount(PAGE_SIZE);
    // Auto-switch sort default per tour context
    setSort(getDefaultSortForTour(tour));
  }, [searchParams, setSearchParams]);

  // Data hooks
  const { data: allPlayers, isLoading: allLoading } = useTourPlayers();
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(200);
  const { data: season } = useTourSeason();
  const { data: playerStats } = useTourPlayerStatistics(season?.id);

  // Tour season rankings (Race to Dubai / Race to CME Globe)
  const tourRankingsCode = activeTour === 'EURO' ? 'euro' : (activeTour === 'LPGA' ? 'lpga' : (activeTour === 'PGAD' ? 'pgad' : (activeTour === 'LIV' ? 'liv' : '')));
  const seasonYear = useMemo(() => {
    const now = new Date();
    return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  }, []);
  const { data: tourRankings } = useTourSeasonRankings(tourRankingsCode, seasonYear);

  // Reset pagination on search/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, sort]);

  // Build world rank & stats lookup from elite players
  const rankMap = useMemo(() => {
    const map = new Map<string, { worldRank: number; avgPoints: number | null }>();
    if (elitePlayers) {
      elitePlayers.forEach(ep => {
        map.set(ep.playerId, { worldRank: ep.worldRank, avgPoints: ep.avgPoints });
      });
    }
    return map;
  }, [elitePlayers]);

  // Build stats map (earnings, wins, tour rank, points, tournamentsPlayed) from player statistics + euro rankings
  const statsMap = useMemo(() => {
    const map = new Map<string, { 
      earnings: number | null; 
      wins: number | null; 
      tourRank: number | null; 
      points: number | null;
      tournamentsPlayed: number | null;
    }>();
    if (playerStats) {
      playerStats.forEach(ps => {
        map.set(ps.player_id, { 
          earnings: ps.earnings, 
          wins: ps.wins,
          tourRank: ps.earnings_rank ?? ps.fedex_rank ?? null,
          points: null,
          tournamentsPlayed: null,
        });
      });
    }
    // Merge tour season rankings (Race to Dubai / Race to CME Globe)
    if ((activeTour === 'EURO' || activeTour === 'LPGA' || activeTour === 'PGAD' || activeTour === 'LIV') && tourRankings) {
      tourRankings.forEach(r => {
        const playerId = r.player_id || r.manual_player_id;
        if (playerId) {
          const existing = map.get(playerId);
          map.set(playerId, {
            earnings: existing?.earnings ?? null,
            wins: r.wins ?? existing?.wins ?? null,
            tourRank: r.position,
            points: r.points,
            tournamentsPlayed: r.tournaments_played,
          });
        }
      });
    }
    return map;
  }, [playerStats, activeTour, tourRankings]);

  // Tour-level filtering
  const tourFilteredPlayers = useMemo(() => {
    if (!allPlayers || activeTour === 'all') return allPlayers || [];
    return allPlayers.filter(p => {
      // Primary: player has this tour in their tour_codes
      if (p.tour_codes?.includes(activeTour)) return true;
      
      // Safety net for PGA: include any player with a world ranking in the top 100
      // who has empty tour_codes (they almost certainly play on PGA Tour)
      if (activeTour === 'pga' && (!p.tour_codes || p.tour_codes.length === 0)) {
        const wr = rankMap.get(p.id)?.worldRank;
        return wr != null && wr <= 100;
      }
      
      return false;
    });
  }, [allPlayers, activeTour, rankMap]);

  // Tour counts
  const tourCounts = useMemo(() => {
    if (!allPlayers) return {};
    const counts: Record<string, number> = {};
    allPlayers.forEach(p => {
      p.tour_codes?.forEach(code => {
        counts[code] = (counts[code] || 0) + 1;
      });
    });
    return counts;
  }, [allPlayers]);

  // Hero players — sorted to match the active sort selection
  const heroPlayers = useMemo<ElitePlayer[]>(() => {
    // Helper: sort candidates by current sort criteria
    const sortCandidates = (candidates: ElitePlayer[]) => {
      return [...candidates].sort((a, b) => {
        const aStats = statsMap.get(a.playerId);
        const bStats = statsMap.get(b.playerId);

        switch (sort) {
          case 'most-wins': {
            const aWins = aStats?.wins ?? 0;
            const bWins = bStats?.wins ?? 0;
            if (bWins !== aWins) return bWins - aWins;
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            return (bStats?.points ?? 0) - (aStats?.points ?? 0);
          }
          case 'alpha-az':
            return a.playerName.localeCompare(b.playerName);
          case 'alpha-za':
            return b.playerName.localeCompare(a.playerName);
          case 'highest-earnings': {
            const aEarn = aStats?.earnings ?? 0;
            const bEarn = bStats?.earnings ?? 0;
            if (bEarn !== aEarn) return bEarn - aEarn;
            const aRank = aStats?.tourRank ?? a.worldRank ?? Infinity;
            const bRank = bStats?.tourRank ?? b.worldRank ?? Infinity;
            return aRank - bRank;
          }
        case 'race-to-dubai':
        case 'race-to-cme':
        case 'points-list':
        case 'liv-standings': {
            const aRank = aStats?.tourRank ?? Infinity;
            const bRank = bStats?.tourRank ?? Infinity;
            if (aRank !== bRank) return aRank - bRank;
            return (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity);
          }
          default: {
            // World Ranking sort always uses OWGR worldRank, regardless of tour
            const aWR = a.worldRank ?? Infinity;
            const bWR = b.worldRank ?? Infinity;
            if (aWR !== bWR) return aWR - bWR;
            return (bStats?.earnings ?? 0) - (aStats?.earnings ?? 0);
          }
        }
      });
    };

    if (activeTour === 'all') {
      // Showcase: top 8 by world ranking
      return (elitePlayers || [])
        .filter(p => p.worldRank && p.worldRank > 0)
        .sort((a, b) => (a.worldRank || 999) - (b.worldRank || 999))
        .slice(0, 8);
    }
    
    // Filter elite players for this tour
    const tourElite = (elitePlayers || []).filter(ep => {
      const player = allPlayers?.find(p => p.id === ep.playerId);
      if (!player) return false;
      if (player.tour_codes?.includes(activeTour)) return true;
      
      // Safety net for PGA
      if (activeTour === 'pga' && (!player.tour_codes || player.tour_codes.length === 0)) {
        return ep.worldRank != null && ep.worldRank <= 100;
      }
      
      return false;
    });

    // For tour-specific sorts, supplement hero pool with ALL tour players
    // so leaders who aren't in OWGR top 200 can appear (e.g. Jarvis, Schott on DP World)
    const needsFullPool = sort === 'most-wins' || sort === 'highest-earnings' || sort === 'race-to-dubai' || sort === 'race-to-cme' || sort === 'points-list' || sort === 'liv-standings';
    
    const toEliteShape = (p: TourPlayer): ElitePlayer => ({
      id: p.id,
      playerId: p.id,
      playerName: p.full_name,
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      country: p.country,
      countryCode: p.country_code,
      photoUrl: p.photo_url,
      pgaTourId: p.pga_tour_id,
      tourCode: p.tour_codes?.[0] ?? null,
      worldRank: rankMap.get(p.id)?.worldRank ?? 0,
      avgPoints: rankMap.get(p.id)?.avgPoints ?? null,
      priorRank: null,
      rankChange: null,
    });

    let heroPool: ElitePlayer[] = [...tourElite];

    if (needsFullPool && tourFilteredPlayers && tourFilteredPlayers.length > 0) {
      const existingIds = new Set(heroPool.map(ep => ep.playerId));
      const additional = tourFilteredPlayers
        .filter(p => !existingIds.has(p.id))
        .map(toEliteShape);
      heroPool = [...heroPool, ...additional];
    }

    if (heroPool.length > 0) {
      return sortCandidates(heroPool).slice(0, 5);
    }
    
    // Fallback: build hero data from tour-filtered players (for tours with no elite players at all)
    if (!tourFilteredPlayers || tourFilteredPlayers.length === 0) return [];
    
    return tourFilteredPlayers.slice(0, 5).map(toEliteShape);
  }, [elitePlayers, activeTour, allPlayers, statsMap, tourFilteredPlayers, rankMap, sort]);

  // Search filter
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // Pipeline: tour → search → sort → pagination
  const { rows, totalCount } = useMemo(() => {
    let filtered = tourFilteredPlayers.filter(p => matchesSearch(p.full_name, p.country));

    // Sort — use tour-specific rank when a specific tour is selected
    filtered = [...filtered].sort((a, b) => {
      const aWorldRank = rankMap.get(a.id)?.worldRank ?? Infinity;
      const bWorldRank = rankMap.get(b.id)?.worldRank ?? Infinity;
      
      // Primary rank: tour rank for specific tours, OWGR for "all"
      const aRank = activeTour === 'all' 
        ? aWorldRank 
        : (statsMap.get(a.id)?.tourRank ?? aWorldRank);
      const bRank = activeTour === 'all' 
        ? bWorldRank 
        : (statsMap.get(b.id)?.tourRank ?? bWorldRank);

      switch (sort) {
        case 'world-rank-desc': {
          const aWR = rankMap.get(a.id)?.worldRank ?? Infinity;
          const bWR = rankMap.get(b.id)?.worldRank ?? Infinity;
          if (aWR === Infinity && bWR === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aWR === Infinity) return 1;
          if (bWR === Infinity) return -1;
          if (aWR !== bWR) return aWR - bWR;
          return a.full_name.localeCompare(b.full_name);
        }
        case 'world-rank-asc':
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          if (aRank !== bRank) return bRank - aRank;
          return a.full_name.localeCompare(b.full_name);
        case 'alpha-az':
          return a.full_name.localeCompare(b.full_name);
        case 'alpha-za':
          return b.full_name.localeCompare(a.full_name);
        case 'most-wins': {
          const aStats = statsMap.get(a.id);
          const bStats = statsMap.get(b.id);
          const aWins = aStats?.wins ?? 0;
          const bWins = bStats?.wins ?? 0;
          if (bWins !== aWins) return bWins - aWins;
          const aEarn = aStats?.earnings ?? 0;
          const bEarn = bStats?.earnings ?? 0;
          if (bEarn !== aEarn) return bEarn - aEarn;
          return (bStats?.points ?? 0) - (aStats?.points ?? 0);
        }
        case 'highest-earnings': {
          const aEarn = statsMap.get(a.id)?.earnings ?? 0;
          const bEarn = statsMap.get(b.id)?.earnings ?? 0;
          return bEarn - aEarn || aRank - bRank;
        }
        case 'race-to-dubai':
        case 'race-to-cme':
        case 'points-list':
        case 'liv-standings': {
          // Sort by tour ranking position, unranked to bottom
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          if (aRank !== bRank) return aRank - bRank;
          return a.full_name.localeCompare(b.full_name);
        }
        default:
          return aRank - bRank;
      }
    });

    return { rows: filtered, totalCount: filtered.length };
  }, [tourFilteredPlayers, matchesSearch, sort, rankMap, statsMap, activeTour]);

  const showHero = !debouncedSearch;
  const isLoading = allLoading && (!allPlayers || (allPlayers as TourPlayer[]).length === 0);

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const contentKey = `${activeTour}-${debouncedSearch}-${sort}`;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="w-full" style={{ height: '45dvh' }} />
        <div className="px-4 space-y-3">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-11 rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="flex items-center justify-center"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isRefreshing ? 48 : pullDistance, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RefreshCw
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                isRefreshing && 'animate-spin'
              )}
              style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      {showHero && heroPlayers.length > 0 && (
        <PlayersHero players={heroPlayers} activeTour={activeTour} statsMap={statsMap} sort={sort} />
      )}

      {/* ══════════════════════════════════════════════
          STICKY HEADER — back link · sort · tour · search
          ══════════════════════════════════════════════ */}
      <div
        className="-mx-4 sticky top-0 z-20"
        style={{
          background: 'hsl(var(--background) / 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsl(var(--border) / 0.10)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        }}
      >
        {/* Collapsible search bar */}
        <div
          className="overflow-hidden transition-all duration-250 ease-in-out px-4"
          style={{
            maxHeight: searchExpanded ? 60 : 0,
            opacity: searchExpanded ? 1 : 0,
          }}
        >
          <div className="relative pt-2.5">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[17px] h-[17px] mt-[5px]"
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="Search players, countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full h-11 pl-10 pr-9 rounded-xl text-[13px] transition-all duration-200',
                'bg-card border text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60',
                'border-border/50'
              )}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-[5px] p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main control row */}
        <div className="flex items-center gap-2 px-4 pt-2.5">
          {/* ← Tour Overview */}
          <button
            type="button"
            onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
            className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground/70 active:opacity-50 transition-opacity shrink-0"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Tour Overview
          </button>

          <div className="flex-1" />

          {/* Sort pill — only when a specific tour is selected */}
          {activeTour !== 'all' && (
            <button
              onClick={() => setSortSheetOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] shrink-0',
                'bg-card border border-border/50 shadow-sm',
                'transition-all duration-150 active:scale-[0.97]'
              )}
            >
              <SlidersHorizontal
                className="w-[12px] h-[12px] shrink-0"
                style={{ color: '#F59E0B' }}
                strokeWidth={2.5}
              />
              <span className="text-[12px] font-semibold text-foreground">
                {getSortShortLabel(sort, activeTour)}
              </span>
              <ChevronDown className="w-[11px] h-[11px] text-muted-foreground/60" strokeWidth={2.5} />
            </button>
          )}

          {/* Tour filter pill */}
          <button
            onClick={() => setTourSheetOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] shrink-0',
              'bg-card border border-border/50 shadow-sm',
              'transition-all duration-150 active:scale-[0.97]',
              activeTour !== 'all' ? 'border-amber-400/40 bg-amber-50/60' : ''
            )}
          >
            <Globe
              className="w-[12px] h-[12px] shrink-0"
              style={{ color: '#F59E0B' }}
              strokeWidth={2.5}
            />
            <span className="text-[12px] font-semibold text-foreground">
              {activeTour === 'all'
                ? 'All Tours'
                : activeTour === 'pga' ? 'PGA Tour'
                : activeTour === 'EURO' ? 'DP World Tour'
                : activeTour === 'LPGA' ? 'LPGA'
                : activeTour === 'PGAD' ? 'Korn Ferry'
                : activeTour === 'LIV' ? 'LIV Golf'
                : 'All Tours'}
            </span>
            <ChevronDown className="w-[11px] h-[11px] text-muted-foreground/60" strokeWidth={2.5} />
          </button>

          {/* Search icon toggle */}
          <button
            onClick={() => setSearchExpanded(v => !v)}
            className={cn(
              'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0',
              'transition-colors duration-150',
              searchExpanded ? 'bg-amber-50' : 'bg-transparent'
            )}
          >
            <Search
              className="w-[16px] h-[16px] transition-colors duration-150"
              style={{ color: searchExpanded ? '#F59E0B' : undefined }}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Count / context label */}
        <div className="flex justify-end px-4 pt-1.5 pb-2.5">
          <span className="text-[11px] font-medium text-muted-foreground/50">
            {activeTour === 'all'
              ? `${totalCount.toLocaleString()} players · A–Z`
              : `${(tourCounts[activeTour] ?? 0).toLocaleString()} players`}
          </span>
        </div>
      </div>

      {/* World's Best showcase — All Tours only, sits below sticky header */}
      {activeTour === 'all' && !debouncedSearch && elitePlayers && elitePlayers.length > 0 && (
        <div className="px-4 mt-5">
          <PlayersWorldsBest players={elitePlayers.slice(0, 5)} />
        </div>
      )}

      {/* Sort bottom sheet — portaled to escape backdrop-blur stacking context */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        ariaLabelledBy="players-sort-sheet-title"
      >
        <div className="px-5 pt-3 pb-4 border-b border-border/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#F59E0B' }}>
            Sort
          </p>
          <p id="players-sort-sheet-title" className="text-[18px] font-bold text-foreground tracking-tight">Sort Players</p>
        </div>
        {(() => {
          const isPGA = activeTour === 'pga';
          const isEuro = activeTour === 'EURO';
          const isLPGA = activeTour === 'LPGA';
          const isPGAD = activeTour === 'PGAD';
          const isLIV = activeTour === 'LIV';
          const opts: { value: PlayerSortType; label: string }[] =
            isLIV  ? [{ value: 'liv-standings', label: 'Standings' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isPGAD ? [{ value: 'points-list', label: 'Points List' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isLPGA ? [{ value: 'race-to-cme', label: 'Race to CME Globe' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isEuro ? [{ value: 'race-to-dubai', label: 'Race to Dubai' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : isPGA  ? [{ value: 'world-rank-desc', label: 'Highest World Ranking' }, { value: 'highest-earnings', label: 'Highest Earnings' }, { value: 'most-wins', label: 'Most Wins' }, { value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }]
            : [{ value: 'alpha-az', label: 'Alphabetical A–Z' }, { value: 'alpha-za', label: 'Alphabetical Z–A' }];
          return opts.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setVisibleCount(PAGE_SIZE); setSortSheetOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between px-5 py-[14px]',
                'border-b border-border/[0.06] transition-colors duration-100 active:bg-muted/50 text-left',
                sort === opt.value ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <span className={cn('text-[15px]', sort === opt.value ? 'font-bold' : 'font-medium')}>
                {opt.label}
              </span>
              {sort === opt.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              )}
            </button>
          ));
        })()}
      </BottomSheet>

      {/* Tour filter bottom sheet */}
      <BottomSheet
        open={tourSheetOpen}
        onClose={() => setTourSheetOpen(false)}
        ariaLabelledBy="players-tour-sheet-title"
      >
        <div className="px-5 pt-3 pb-4 border-b border-border/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#F59E0B' }}>
            Filter
          </p>
          <p id="players-tour-sheet-title" className="text-[18px] font-bold text-foreground tracking-tight">Select Tour</p>
        </div>
        {(['all', 'pga', 'EURO', 'LPGA', 'PGAD', 'LIV'] as const).map((code) => {
          const labels: Record<string, string> = {
            all: 'All Tours', pga: 'PGA Tour', EURO: 'DP World Tour',
            LPGA: 'LPGA', PGAD: 'Korn Ferry', LIV: 'LIV Golf',
          };
          const isSelected = activeTour === code;
          const count = code === 'all'
            ? Object.values(tourCounts).reduce((s, c) => s + c, 0)
            : (tourCounts[code] ?? 0);
          if (code !== 'all' && count === 0) return null;
          return (
            <button
              key={code}
              onClick={() => { setActiveTour(code as PlayerTourCode); setTourSheetOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between px-5 py-[14px]',
                'border-b border-border/[0.06] transition-colors duration-100 active:bg-muted/50 text-left',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <span className={cn('text-[15px]', isSelected ? 'font-bold' : 'font-medium')}>
                {labels[code]}
              </span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="text-[12px] text-muted-foreground/60 font-medium">
                    {count.toLocaleString()}
                  </span>
                )}
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </BottomSheet>

      {/* Content */}
      <div className="px-4">
        {/* Player cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
            style={{ marginTop: '16px' }}
          >
            {displayRows.length > 0 ? (
              <>
                {displayRows.map((player, index) => {
                  const rank = rankMap.get(player.id);
                  const pStats = statsMap.get(player.id);
                  return (
                    <PlayerCardV2
                      key={player.id}
                      player={{
                        id: player.id,
                        fullName: player.full_name,
                        country: player.country,
                        countryCode: player.country_code,
                        photoUrl: player.photo_url,
                        pgaTourId: player.pga_tour_id,
                        tourCodes: player.tour_codes,
                      }}
                      worldRank={
                        sort === 'world-rank-desc' || sort === 'alpha-az' || sort === 'alpha-za' || activeTour === 'all'
                          ? rank?.worldRank
                          : (pStats?.tourRank || rank?.worldRank)
                      }
                      owgr={rank?.worldRank}
                      earnings={pStats?.earnings}
                      wins={pStats?.wins}
                      points={pStats?.points}
                      tournamentsPlayed={pStats?.tournamentsPlayed}
                      showTourBadge={activeTour === 'all'}
                      index={index}
                      activeSort={sort}
                      activeTour={activeTour}
                      directoryMode={activeTour === 'all'}
                      onNavigate={() => sessionStorage.setItem('players-scroll', String(window.scrollY))}
                    />
                  );
                })}
              </>
            ) : (
              <PlayersEmptyState />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <div className="flex flex-col items-center gap-2" style={{ marginTop: '16px' }}>
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1",
                "rounded-2xl border border-border/50 bg-muted/40",
                "py-3.5",
                "active:scale-[0.97] transition-all",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground) / 0.6)' }}>
                  Show More Players
                </span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'hsl(var(--foreground) / 0.6)' }}>
                 ({Math.min(visibleCount, totalCount) + 1}–{Math.min(visibleCount + PAGE_SIZE, totalCount)} of {totalCount})
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            </button>
          </div>
        )}

        {/* Showing count */}
        {totalCount > 0 && (
          <p className="text-center text-muted-foreground/40 tabular-nums" style={{ fontSize: '12px', fontWeight: 400, marginTop: '8px' }}>
            Showing {Math.min(visibleCount, totalCount)} of {totalCount}
          </p>
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }} />
    </div>
  );
}
