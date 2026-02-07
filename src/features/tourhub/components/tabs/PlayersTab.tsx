/**
 * PlayersTab - Clean orchestrator for the Players tab.
 * 
 * Features:
 * - World's Best showcase (top 5 OWGR)
 * - Debounced search (200ms, min 2 chars)
 * - Tier filter tabs with URL persistence (?tab=players&tier=elite)
 * - PlayerListRow for all players
 * - Semantic tokens, font-mono stats, tap feedback
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTourPlayers, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers, type ElitePlayer } from '../../hooks/useElitePlayers';
import { useActivePlayers, type ActivePlayer } from '../../hooks/useActivePlayers';
import { PlayersWorldsBest } from '../players/PlayersWorldsBest';
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

const TIER_DESCRIPTIONS: Record<PlayerTierType, string> = {
  field: 'The complete PGA Tour field for the current season.',
  elite: 'Top 50 in the Official World Golf Ranking.',
  active: 'Players with 10+ events this season.',
  rising: 'Players who turned pro in the last 3 years.',
};

const DISPLAY_LIMIT = 100;

export function PlayersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);

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
  }, [searchParams, setSearchParams]);

  // Data hooks
  const { data: allPlayers, isLoading: allLoading } = useTourPlayers();
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(50);
  const { data: activePlayers, isLoading: activeLoading } = useActivePlayers(10, 100);

  const isLoading = tier === 'elite' ? eliteLoading : tier === 'active' ? activeLoading : allLoading;

  // World's Best top 5
  const worldTop5 = useMemo(() => {
    if (!elitePlayers) return [];
    return elitePlayers.slice(0, 5);
  }, [elitePlayers]);

  // Search filter helper
  const matchesSearch = useCallback((name: string, country: string | null) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (country?.toLowerCase().includes(q) ?? false);
  }, [debouncedSearch]);

  // Processed players per tier
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
        const filtered = elitePlayers.filter(p => matchesSearch(p.playerName, p.country));
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
        const filtered = activePlayers.filter(p => matchesSearch(p.playerName, p.country));
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
        if (!allPlayers) break;
        const currentYear = new Date().getFullYear();
        const rising = allPlayers
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
        // field
        if (!allPlayers) break;
        const filtered = allPlayers
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
  }, [tier, allPlayers, elitePlayers, activePlayers, debouncedSearch, matchesSearch]);

  // Counts for filter tabs
  const counts = useMemo(() => ({
    field: allPlayers?.length || 0,
    elite: elitePlayers?.length || 0,
    active: activePlayers?.length || 0,
    rising: allPlayers?.filter(p => {
      const y = new Date().getFullYear();
      return p.turned_pro != null && p.turned_pro >= y - 3;
    }).length || 0,
  }), [allPlayers, elitePlayers, activePlayers]);

  const displayRows = rows.slice(0, DISPLAY_LIMIT);
  const hasMore = totalCount > DISPLAY_LIMIT;
  const showWorldsBest = tier === 'field' && !debouncedSearch;

  // Loading skeleton
  if (isLoading && totalCount === 0) {
    return (
      <div className="space-y-4 py-6">
        {/* World's Best skeleton */}
        <div className="rounded-2xl bg-muted/50 h-[280px] animate-pulse" />
        {/* Search skeleton */}
        <div className="bg-muted/50 h-12 rounded-xl animate-pulse" />
        {/* Filter skeleton */}
        <div className="bg-muted/50 h-12 rounded-xl animate-pulse" />
        {/* Row skeletons */}
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
      {/* World's Best */}
      {showWorldsBest && worldTop5.length > 0 && (
        <PlayersWorldsBest players={worldTop5} />
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

      {/* Filter tabs */}
      <PlayerFilterTabs
        activeFilter={tier}
        onFilterChange={setTier}
        counts={counts}
      />

      {/* Context line */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {TIER_DESCRIPTIONS[tier]}
        </p>
        <p className="text-sm font-mono text-muted-foreground shrink-0 ml-3">
          {totalCount} player{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Player list */}
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

      {/* Pagination notice */}
      {hasMore && (
        <p className="text-center text-sm text-muted-foreground py-2">
          Showing <span className="font-mono">{DISPLAY_LIMIT}</span> of{' '}
          <span className="font-mono">{totalCount}</span> players. Search to find specific players.
        </p>
      )}
    </div>
  );
}
