/**
 * PlayersTab - Complete redesign orchestrator.
 * 
 * Features:
 * - Immersive #1 player hero (adapts per tour)
 * - Tour filter pills with dynamic counts
 * - Category filter tabs (Field, Elite, On Tour, Rising)
 * - Debounced search within active tour
 * - Load More pagination (50 per batch)
 * - Dynamic descriptions per tour
 * - URL persistence (?tab=players&tour=pga&tier=elite)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTourPlayers, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useActivePlayers } from '../../hooks/useActivePlayers';
import { PlayersHero } from '../players/PlayersHero';
import { PlayersTourFilter, type PlayerTourCode, TOUR_LABELS } from '../players/PlayersTourFilter';
import { PlayerFilterTabs, type PlayerTierType } from '../players/PlayerFilterTabs';
import { PlayerListRow } from '../players/PlayerListRow';
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

/** Dynamic tier descriptions that adapt to tour filter */
function getTierDescription(tier: PlayerTierType, activeTour: PlayerTourCode): string {
  const tourLabel = activeTour === 'all' ? 'tour' : TOUR_LABELS[activeTour];

  switch (tier) {
    case 'field':
      return `The complete ${tourLabel} field for the current season.`;
    case 'elite':
      return activeTour === 'all'
        ? 'Top 50 in the Official World Golf Ranking.'
        : `Top-ranked ${tourLabel} players by OWGR.`;
    case 'active':
      return `Players with 10+ events this season.`;
    case 'rising':
      return `Players who turned pro in the last 3 years.`;
  }
}

const PAGE_SIZE = 50;

export function PlayersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);

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
    setVisibleCount(PAGE_SIZE); // Reset pagination on tour change
  }, [searchParams, setSearchParams]);

  // Tier from URL
  const tier = (searchParams.get('tier') as PlayerTierType) || 'field';
  const setTier = useCallback((t: PlayerTierType) => {
    const params = new URLSearchParams(searchParams);
    if (t === 'field') {
      params.delete('tier');
    } else {
      params.set('tier', t);
    }
    params.set('tab', 'players');
    setSearchParams(params, { replace: true });
    setVisibleCount(PAGE_SIZE); // Reset pagination on tier change
  }, [searchParams, setSearchParams]);

  // Data hooks
  const { data: allPlayers, isLoading: allLoading } = useTourPlayers();
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(50);
  const { data: activePlayers, isLoading: activeLoading } = useActivePlayers(10, 200);

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  // ─── Tour-level filtering ───
  const tourFilteredPlayers = useMemo(() => {
    if (!allPlayers || activeTour === 'all') return allPlayers || [];
    return allPlayers.filter(p =>
      p.tour_codes && p.tour_codes.includes(activeTour)
    );
  }, [allPlayers, activeTour]);

  // Tour counts for the filter pills
  const tourCounts = useMemo(() => {
    if (!allPlayers) return {};
    const counts: Record<string, number> = {};
    allPlayers.forEach(p => {
      if (p.tour_codes) {
        p.tour_codes.forEach(code => {
          counts[code] = (counts[code] || 0) + 1;
        });
      }
    });
    return counts;
  }, [allPlayers]);

  // ─── Hero: find the #1 player per tour ───
  const heroPlayers = useMemo<ElitePlayer[]>(() => {
    if (!elitePlayers || elitePlayers.length === 0) return [];

    if (activeTour === 'all') {
      return elitePlayers.slice(0, 5);
    }

    // Filter elite players to those on the active tour
    const tourElite = elitePlayers.filter(ep => {
      // Match against allPlayers tour_codes
      const player = allPlayers?.find(p => p.id === ep.playerId);
      return player?.tour_codes?.includes(activeTour);
    });

    return tourElite.slice(0, 5);
  }, [elitePlayers, activeTour, allPlayers]);

  // ─── Search filter ───
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // ─── Pipeline: tour → search → category → pagination ───
  const { rows, totalCount } = useMemo(() => {
    let items: Array<{
      id: string;
      fullName: string;
      country: string | null;
      countryCode: string | null;
      photoUrl: string | null;
      pgaTourId: string | null;
      rank?: number;
      statValue?: string;
      statLabel?: string;
      variant: 'default' | 'ranked';
    }> = [];

    switch (tier) {
      case 'elite': {
        if (!elitePlayers) break;
        // Filter elite by tour membership
        let filtered = elitePlayers;
        if (activeTour !== 'all') {
          filtered = filtered.filter(ep => {
            const player = allPlayers?.find(p => p.id === ep.playerId);
            return player?.tour_codes?.includes(activeTour);
          });
        }
        filtered = filtered.filter(p => matchesSearch(p.playerName, p.country));
        items = filtered.map(p => ({
          id: p.playerId,
          fullName: p.playerName,
          country: p.country,
          countryCode: p.countryCode,
          photoUrl: p.photoUrl,
          pgaTourId: p.pgaTourId,
          rank: p.worldRank,
          statValue: p.avgPoints != null ? p.avgPoints.toFixed(2) : undefined,
          statLabel: 'avg pts',
          variant: 'ranked' as const,
        }));
        break;
      }
      case 'active': {
        if (!activePlayers) break;
        let filtered = activePlayers;
        if (activeTour !== 'all') {
          filtered = filtered.filter(ap => {
            const player = allPlayers?.find(p => p.id === ap.playerId);
            return player?.tour_codes?.includes(activeTour);
          });
        }
        filtered = filtered.filter(p => matchesSearch(p.playerName, p.country));
        items = filtered.map((p, i) => ({
          id: p.playerId,
          fullName: p.playerName,
          country: p.country,
          countryCode: p.countryCode,
          photoUrl: p.photoUrl,
          pgaTourId: p.pgaTourId,
          rank: i + 1,
          statValue: String(p.eventsPlayed),
          statLabel: 'events',
          variant: 'ranked' as const,
        }));
        break;
      }
      case 'rising': {
        const currentYear = new Date().getFullYear();
        const rising = tourFilteredPlayers
          .filter(p => p.turned_pro != null && p.turned_pro >= currentYear - 3 && matchesSearch(p.full_name, p.country))
          .sort((a, b) => (b.turned_pro || 0) - (a.turned_pro || 0));
        items = rising.map(p => ({
          id: p.id,
          fullName: p.full_name,
          country: p.country,
          countryCode: p.country_code,
          photoUrl: p.photo_url,
          pgaTourId: p.pga_tour_id,
          statValue: p.turned_pro ? `Pro ${p.turned_pro}` : undefined,
          statLabel: undefined,
          variant: 'default' as const,
        }));
        break;
      }
      default: {
        // field — use tour-filtered players
        const filtered = tourFilteredPlayers
          .filter(p => matchesSearch(p.full_name, p.country))
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
        items = filtered.map(p => ({
          id: p.id,
          fullName: p.full_name,
          country: p.country,
          countryCode: p.country_code,
          photoUrl: p.photo_url,
          pgaTourId: p.pga_tour_id,
          variant: 'default' as const,
        }));
        break;
      }
    }

    return { rows: items, totalCount: items.length };
  }, [tier, tourFilteredPlayers, elitePlayers, activePlayers, allPlayers, activeTour, debouncedSearch, matchesSearch]);

  // ─── Dynamic counts per tier (filtered by active tour) ───
  const counts = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const fieldCount = tourFilteredPlayers.length;

    // Elite filtered by tour
    let eliteCount = elitePlayers?.length || 0;
    if (activeTour !== 'all' && elitePlayers && allPlayers) {
      eliteCount = elitePlayers.filter(ep => {
        const player = allPlayers.find(p => p.id === ep.playerId);
        return player?.tour_codes?.includes(activeTour);
      }).length;
    }

    // Active filtered by tour
    let activeCount = activePlayers?.length || 0;
    if (activeTour !== 'all' && activePlayers && allPlayers) {
      activeCount = activePlayers.filter(ap => {
        const player = allPlayers.find(p => p.id === ap.playerId);
        return player?.tour_codes?.includes(activeTour);
      }).length;
    }

    const risingCount = tourFilteredPlayers.filter(p =>
      p.turned_pro != null && p.turned_pro >= currentYear - 3
    ).length;

    return { field: fieldCount, elite: eliteCount, active: activeCount, rising: risingCount };
  }, [tourFilteredPlayers, elitePlayers, activePlayers, allPlayers, activeTour]);

  const displayRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;
  const showHero = tier === 'field' && !debouncedSearch;
  const isLoading = tier === 'elite' ? eliteLoading : tier === 'active' ? activeLoading : allLoading;

  // Loading skeleton
  if (isLoading && totalCount === 0) {
    return (
      <div className="space-y-4 py-6">
        <div className="rounded-2xl bg-muted/50 h-[340px] animate-pulse" />
        <div className="bg-muted/50 h-12 rounded-xl animate-pulse" />
        <div className="bg-muted/50 h-12 rounded-xl animate-pulse" />
        <div className="bg-muted/50 h-12 rounded-xl animate-pulse" />
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-muted/30 border-b border-border/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-6">
      {/* Immersive Hero */}
      {showHero && heroPlayers.length > 0 && (
        <PlayersHero players={heroPlayers} activeTour={activeTour} />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search players, countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full h-12 pl-11 pr-10",
            "bg-card/80 border border-border",
            "rounded-xl text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
            "transition-all"
          )}
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted/80 active:scale-[0.9] transition-transform"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Tour filter pills */}
      <PlayersTourFilter
        activeTour={activeTour}
        onTourChange={setActiveTour}
        tourCounts={tourCounts}
      />

      {/* Category filter tabs */}
      <PlayerFilterTabs
        activeFilter={tier}
        onFilterChange={setTier}
        counts={counts}
      />

      {/* Context line */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {getTierDescription(tier, activeTour)}
        </p>
        <p className="text-sm font-mono text-muted-foreground shrink-0 ml-3">
          {totalCount} player{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Player list */}
      <div ref={listRef}>
        {displayRows.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {displayRows.map((row) => (
              <PlayerListRow
                key={row.id}
                player={{
                  id: row.id,
                  fullName: row.fullName,
                  country: row.country,
                  countryCode: row.countryCode,
                  photoUrl: row.photoUrl,
                  pgaTourId: row.pgaTourId,
                }}
                rank={row.rank}
                statValue={row.statValue}
                statLabel={row.statLabel}
                variant={row.variant}
              />
            ))}
          </div>
        ) : (
          <PlayersEmptyState />
        )}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className={cn(
              "w-full max-w-xs h-11 flex items-center justify-center gap-1.5",
              "rounded-xl border border-border bg-card",
              "text-sm font-medium text-foreground",
              "hover:bg-muted/50 active:scale-[0.98] transition-all"
            )}
          >
            Show {Math.min(PAGE_SIZE, totalCount - visibleCount)} more players
            <ChevronDown className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-muted-foreground">
            Showing {visibleCount} of {totalCount} players
          </p>
        </div>
      )}
    </div>
  );
}
