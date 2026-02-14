/**
 * PlayersTab - Redesigned Players page.
 * 
 * - Hero: #1 player for every tour filter
 * - No category tabs (Field/Elite/On Tour/Rising removed)
 * - Sort dropdown (world rank, alpha, events, earnings)
 * - Card layout with player photo filling left side
 * - Load More pagination (50 per batch)
 * - Tour filter pills (dark active, matches schedule style)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTourPlayers, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { usePlayerHeadshots } from '../../hooks/usePlayerMedia';
import { PlayersHero } from '../players/PlayersHero';
import { PlayersTourFilter, type PlayerTourCode } from '../players/PlayersTourFilter';
import { PlayerSortControl, type PlayerSortType } from '../players/PlayerSortControl';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<PlayerSortType>('world-rank-desc');

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

  // Hero players
  const heroPlayers = useMemo<ElitePlayer[]>(() => {
    if (!elitePlayers || elitePlayers.length === 0) return [];
    if (activeTour === 'all') return elitePlayers.slice(0, 5);
    const tourElite = elitePlayers.filter(ep => {
      const player = allPlayers?.find(p => p.id === ep.playerId);
      return player?.tour_codes?.includes(activeTour);
    });
    return tourElite.slice(0, 5);
  }, [elitePlayers, activeTour, allPlayers]);

  // Search filter
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // Pipeline: tour → search → sort → pagination
  const { rows, totalCount } = useMemo(() => {
    let filtered = tourFilteredPlayers.filter(p => matchesSearch(p.full_name, p.country));

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aRank = rankMap.get(a.id)?.worldRank ?? Infinity;
      const bRank = rankMap.get(b.id)?.worldRank ?? Infinity;

      switch (sort) {
        case 'world-rank-desc':
          return aRank - bRank;
        case 'world-rank-asc':
          if (aRank === Infinity && bRank === Infinity) return a.full_name.localeCompare(b.full_name);
          if (aRank === Infinity) return 1;
          if (bRank === Infinity) return -1;
          return bRank - aRank;
        case 'alpha-az':
          return a.full_name.localeCompare(b.full_name);
        case 'alpha-za':
          return b.full_name.localeCompare(a.full_name);
        case 'most-events':
          // We don't have events on TourPlayer directly; use rank as tiebreak
          return aRank - bRank;
        case 'highest-earnings':
          return aRank - bRank;
        default:
          return aRank - bRank;
      }
    });

    return { rows: filtered, totalCount: filtered.length };
  }, [tourFilteredPlayers, matchesSearch, sort, rankMap]);

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;
  const showHero = !debouncedSearch;
  const isLoading = allLoading && (!allPlayers || (allPlayers as TourPlayer[]).length === 0);

  // Batch headshots
  const visiblePlayerIds = useMemo(() => displayRows.map(r => r.id), [displayRows]);
  const { data: headshotMap } = usePlayerHeadshots(visiblePlayerIds);

  const contentKey = `${activeTour}-${debouncedSearch}-${sort}`;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 py-6 -mx-4">
        <div className="bg-muted/40 animate-pulse" style={{ height: 'clamp(282px, 53vh, 422px)' }} />
        <div className="px-4 space-y-3">
          <div className="bg-muted/40 h-12 rounded-xl animate-pulse" />
          <div className="bg-muted/40 h-11 rounded-xl animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[110px] bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 -mx-4">
      {/* Hero */}
      {showHero && heroPlayers.length > 0 && (
        <PlayersHero players={heroPlayers} activeTour={activeTour} />
      )}

      {/* Search Bar — matches schedule page width/style (inside px-4 wrapper) */}
      <div className="px-4 pt-4">
        <div className="relative mb-4">
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
              "w-full h-12 pl-11 pr-10 rounded-xl text-[14px] transition-all duration-200",
              "bg-card/80 backdrop-blur-sm border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:bg-card",
              "border-border/60 ring-transparent shadow-sm",
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

      {/* Sticky toolbar — tour filter pills with px-4 for 16px viewport gap */}
      <div className={cn(
        "sticky top-0 z-20",
        "bg-background/95 backdrop-blur-sm",
        "px-4 pb-2 space-y-2",
      )}>
        <PlayersTourFilter
          activeTour={activeTour}
          onTourChange={setActiveTour}
          tourCounts={tourCounts}
        />
      </div>

      {/* Content */}
      <div className="space-y-3 mt-4 px-4">
        {/* Count + sort row */}
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[13px] text-muted-foreground tabular-nums">
            {totalCount} player{totalCount !== 1 ? 's' : ''}
          </p>
          <PlayerSortControl value={sort} onChange={(v) => { setSort(v); setVisibleCount(PAGE_SIZE); }} />
        </div>

        {/* Player cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {displayRows.length > 0 ? (
              <>
                {displayRows.map((player, index) => {
                  const rank = rankMap.get(player.id);
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
                      worldRank={rank?.worldRank}
                      batchHeadshotUrl={headshotMap?.get(player.id)}
                      showTourBadge={activeTour === 'all'}
                      index={index}
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
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className={cn(
                "w-full max-w-md h-12 flex items-center justify-center gap-1.5",
                "rounded-xl border border-border bg-muted",
                "text-sm font-medium text-foreground",
                "hover:bg-muted/80 active:scale-[0.97] transition-all",
              )}
            >
              Show More Players ({visibleCount + 1}-{Math.min(visibleCount + PAGE_SIZE, totalCount)} of {totalCount})
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Showing count */}
        {totalCount > 0 && (
          <p className="text-center text-[11px] text-muted-foreground/50 tabular-nums">
            Showing {Math.min(visibleCount, totalCount)} of {totalCount}
          </p>
        )}
      </div>
    </div>
  );
}
