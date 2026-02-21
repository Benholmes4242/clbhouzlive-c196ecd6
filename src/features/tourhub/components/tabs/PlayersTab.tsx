/**
 * PlayersTab - Redesigned Players page.
 * Aligned with Tour Overview audit spacing & typography.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Search, X, ChevronDown, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { usePlayerHeadshots } from '../../hooks/usePlayerMedia';
import { PlayersHero } from '../players/PlayersHero';
import { type PlayerTourCode } from '../players/PlayersTourFilter';
import { PlayerSortControl, type PlayerSortType } from '../players/PlayerSortControl';
import { PlayersTourFilterSheet } from '../players/PlayersTourFilterSheet';
import { PlayerCardV2 } from '../players/PlayerCardV2';
import { PlayersEmptyState } from '../players/PlayersEmptyState';

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<PlayerSortType>('world-rank-desc');

  // Scroll-to-top on mount / restore on back nav
  useEffect(() => {
    const saved = sessionStorage.getItem('players-scroll');
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
      sessionStorage.removeItem('players-scroll');
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

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
  }, [searchParams, setSearchParams]);

  // Data hooks
  const { data: allPlayers, isLoading: allLoading } = useTourPlayers();
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(200);
  const { data: season } = useTourSeason();
  const { data: playerStats } = useTourPlayerStatistics(season?.id);

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

  // Build stats map (earnings, wins, tour rank) from player statistics
  const statsMap = useMemo(() => {
    const map = new Map<string, { earnings: number | null; wins: number | null; tourRank: number | null }>();
    if (playerStats) {
      playerStats.forEach(ps => {
        map.set(ps.player_id, { 
          earnings: ps.earnings, 
          wins: ps.wins,
          tourRank: ps.earnings_rank ?? ps.fedex_rank ?? null,
        });
      });
    }
    return map;
  }, [playerStats]);

  // Tour-level filtering
  const tourFilteredPlayers = useMemo(() => {
    if (!allPlayers || activeTour === 'all') return allPlayers || [];
    return allPlayers.filter(p => p.tour_codes?.includes(activeTour));
  }, [allPlayers, activeTour]);

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

  // Hero players — sort by tour rank when a specific tour is selected
  // Falls back to building hero data from tourFilteredPlayers when no elite players exist for the tour
  const heroPlayers = useMemo<ElitePlayer[]>(() => {
    if (activeTour === 'all') {
      return (elitePlayers || []).slice(0, 5);
    }
    
    // Filter elite players for this tour
    const tourElite = (elitePlayers || []).filter(ep => {
      const player = allPlayers?.find(p => p.id === ep.playerId);
      return player?.tour_codes?.includes(activeTour);
    });
    
    if (tourElite.length > 0) {
      return tourElite
        .sort((a, b) => {
          const aRank = statsMap.get(a.playerId)?.tourRank ?? a.worldRank ?? Infinity;
          const bRank = statsMap.get(b.playerId)?.tourRank ?? b.worldRank ?? Infinity;
          return aRank - bRank;
        })
        .slice(0, 5);
    }
    
    // Fallback: build hero data from tour-filtered players (for LPGA, Korn Ferry, etc.)
    if (!tourFilteredPlayers || tourFilteredPlayers.length === 0) return [];
    
    const sorted = [...tourFilteredPlayers].sort((a, b) => {
      const aRank = rankMap.get(a.id)?.worldRank ?? Infinity;
      const bRank = rankMap.get(b.id)?.worldRank ?? Infinity;
      const aTourRank = statsMap.get(a.id)?.tourRank;
      const bTourRank = statsMap.get(b.id)?.tourRank;
      // Prefer tour rank if available, else OWGR, else alphabetical
      const aSort = aTourRank ?? aRank;
      const bSort = bTourRank ?? bRank;
      if (aSort === Infinity && bSort === Infinity) return a.full_name.localeCompare(b.full_name);
      return aSort - bSort;
    });
    
    return sorted.slice(0, 5).map((p, i) => ({
      id: p.id,
      playerId: p.id,
      playerName: p.full_name,
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      country: p.country,
      countryCode: p.country_code,
      photoUrl: p.photo_url,
      pgaTourId: p.pga_tour_id,
      worldRank: rankMap.get(p.id)?.worldRank ?? 0,
      avgPoints: rankMap.get(p.id)?.avgPoints ?? null,
      priorRank: null,
      rankChange: null,
    }));
  }, [elitePlayers, activeTour, allPlayers, statsMap, tourFilteredPlayers, rankMap]);

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
        case 'world-rank-desc':
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          if (aRank !== bRank) return aRank - bRank;
          return a.full_name.localeCompare(b.full_name);
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
          const aWins = statsMap.get(a.id)?.wins ?? 0;
          const bWins = statsMap.get(b.id)?.wins ?? 0;
          return bWins - aWins || aRank - bRank;
        }
        case 'highest-earnings': {
          const aEarn = statsMap.get(a.id)?.earnings ?? 0;
          const bEarn = statsMap.get(b.id)?.earnings ?? 0;
          return bEarn - aEarn || aRank - bRank;
        }
        default:
          return aRank - bRank;
      }
    });

    return { rows: filtered, totalCount: filtered.length };
  }, [tourFilteredPlayers, matchesSearch, sort, rankMap]);

  const showHero = !debouncedSearch;
  const isLoading = allLoading && (!allPlayers || (allPlayers as TourPlayer[]).length === 0);

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  // Batch headshots
  const visiblePlayerIds = useMemo(() => displayRows.map(r => r.id), [displayRows]);
  const { data: headshotMap } = usePlayerHeadshots(visiblePlayerIds);

  const contentKey = `${activeTour}-${debouncedSearch}-${sort}`;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="bg-muted/40 animate-pulse" style={{ height: 'clamp(260px, 45vh, 380px)' }} />
        <div className="px-4 space-y-3">
          <div className="bg-muted/40 h-12 rounded-2xl animate-pulse" />
          <div className="bg-muted/40 h-11 rounded-2xl animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-muted/20 rounded-2xl animate-pulse" />
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
        <PlayersHero players={heroPlayers} activeTour={activeTour} statsMap={statsMap} />
      )}

      {/* Search Bar — 24px gap from runner cards */}
      <div className="px-4" style={{ marginTop: showHero ? '24px' : '16px' }}>
        <div className="relative">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[18px] h-[18px]"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search players, countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-12 pl-11 pr-10 rounded-2xl text-[13px] transition-all duration-200",
              "bg-card border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:bg-card",
              "border-border/50 ring-transparent shadow-sm",
              "focus:border-border focus:ring-border/50 focus:shadow-lg"
            )}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted hover:bg-muted/80 active:scale-[0.9] transition-transform"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tour dropdown — 24px from search */}
      <div className="px-4" style={{ marginTop: '24px' }}>
        <PlayersTourFilterSheet
          activeTour={activeTour}
          onTourChange={setActiveTour}
          tourCounts={tourCounts}
        />
      </div>

      {/* Content */}
      <div className="px-4">
        {/* Sort row — 24px from tour dropdown */}
        <div className="flex items-center justify-end" style={{ marginTop: '24px' }}>
          <PlayerSortControl value={sort} onChange={(v) => { setSort(v); setVisibleCount(PAGE_SIZE); }} />
        </div>

        {/* Player cards — 12px from sort */}
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
            style={{ marginTop: '12px' }}
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
                      worldRank={activeTour === 'all' 
                        ? rank?.worldRank 
                        : (pStats?.tourRank || rank?.worldRank)}
                      earnings={pStats?.earnings}
                      wins={pStats?.wins}
                      batchHeadshotUrl={headshotMap?.get(player.id)}
                      showTourBadge={activeTour === 'all'}
                      index={index}
                      activeSort={sort}
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
                 ({visibleCount + 1}-{Math.min(visibleCount + PAGE_SIZE, totalCount)} of {totalCount})
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
      <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }} />
    </div>
  );
}
