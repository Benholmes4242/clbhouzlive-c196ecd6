/**
 * PlayersTab - Redesigned Players page.
 * Aligned with Tour Overview audit spacing & typography.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronDown, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useTourSeasonRankings } from '../../hooks/useTourSeasonRankings';
import { PlayersHero } from '../players/PlayersHero';
import { type PlayerTourCode } from '../players/PlayersTourFilter';
import { PlayerSortControl, type PlayerSortType, getDefaultSortForTour } from '../players/PlayerSortControl';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const initialTour = searchParams.get('tour') || 'all';
  const [sort, setSort] = useState<PlayerSortType>(getDefaultSortForTour(initialTour));

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
            return (bStats?.earnings ?? 0) - (aStats?.earnings ?? 0);
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
      return player?.tour_codes?.includes(activeTour);
    });
    
    if (tourElite.length > 0) {
      return sortCandidates(tourElite).slice(0, 5);
    }
    
    // Fallback: build hero data from tour-filtered players (for LPGA, Korn Ferry, etc.)
    if (!tourFilteredPlayers || tourFilteredPlayers.length === 0) return [];
    
    const sorted = [...tourFilteredPlayers].sort((a, b) => {
      const aRank = rankMap.get(a.id)?.worldRank ?? Infinity;
      const bRank = rankMap.get(b.id)?.worldRank ?? Infinity;
      const aTourRank = statsMap.get(a.id)?.tourRank;
      const bTourRank = statsMap.get(b.id)?.tourRank;
      const aSort = aTourRank ?? aRank;
      const bSort = bTourRank ?? bRank;
      if (aSort === Infinity && bSort === Infinity) return a.full_name.localeCompare(b.full_name);
      return aSort - bSort;
    });
    
    return sorted.slice(0, 5).map((p) => ({
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
    }));
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
          const aWins = statsMap.get(a.id)?.wins ?? 0;
          const bWins = statsMap.get(b.id)?.wins ?? 0;
          const aEarn = statsMap.get(a.id)?.earnings ?? 0;
          const bEarn = statsMap.get(b.id)?.earnings ?? 0;
          return bWins - aWins || bEarn - aEarn;
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
        <div className="bg-muted/40 animate-pulse" style={{ height: '50dvh' }} />
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
        <PlayersHero players={heroPlayers} activeTour={activeTour} statsMap={statsMap} sort={sort} />
      )}

      {/* ← Tour Overview back link */}
      <div className="px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => navigate('/tourhub?tab=overview', { replace: true })}
          className="text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          ← Tour Overview
        </button>
      </div>

      {/* Search Bar — 24px gap from runner cards */}
      <div className="px-4" style={{ marginTop: '12px' }}>
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
        {/* Sort row — 24px from tour dropdown (hidden for All Tours) */}
        {activeTour !== 'all' && (
          <div className="flex items-center justify-end" style={{ marginTop: '24px' }}>
            <PlayerSortControl value={sort} onChange={(v) => { setSort(v); setVisibleCount(PAGE_SIZE); }} activeTour={activeTour} />
          </div>
        )}

        {/* Player cards — 12px from sort */}
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
            style={{ marginTop: activeTour === 'all' ? '24px' : '12px' }}
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
