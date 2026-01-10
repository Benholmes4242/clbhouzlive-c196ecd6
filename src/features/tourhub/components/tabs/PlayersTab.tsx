/**
 * PlayersTab - Redesigned Premium Players Experience
 * 
 * Features:
 * - Featured players carousel at top
 * - Search + filter chips
 * - Flat editorial rows (not cards)
 * - Sort control
 * - Human pagination messaging
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import {
  FeaturedPlayersCarousel,
  PlayerFilterChips,
  type PlayerFilterType,
  PlayerSortControl,
  type PlayerSortType,
  PlayerRow,
} from '../players';

export function PlayersTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlayerFilterType>('all');
  const [sort, setSort] = useState<PlayerSortType>('alphabetical');
  
  const { data: season } = useTourSeason();
  const { data: players, isLoading: playersLoading } = useTourPlayers();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);

  const isLoading = playersLoading || statsLoading;

  // Create stats lookup map
  const statsMap = useMemo(() => {
    if (!playerStats) return new Map<string, TourPlayerStatistics>();
    return new Map(playerStats.map(s => [s.player_id, s]));
  }, [playerStats]);

  // Filter and sort players
  const processedPlayers = useMemo(() => {
    if (!players) return [];

    let filtered = [...players];

    // Apply search
    if (search && search.length >= 2) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(searchLower) ||
        p.country?.toLowerCase().includes(searchLower) ||
        p.college?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filter
    switch (filter) {
      case 'top-ranked':
        // Only players with fedex_rank
        filtered = filtered.filter(p => {
          const stats = statsMap.get(p.id);
          return stats?.fedex_rank && stats.fedex_rank <= 50;
        });
        break;
      case 'most-active':
        // Players with most events
        filtered = filtered.filter(p => {
          const stats = statsMap.get(p.id);
          return stats?.events_played && stats.events_played >= 10;
        });
        break;
      case 'rookies':
        // Turned pro in last 3 years
        const currentYear = new Date().getFullYear();
        filtered = filtered.filter(p =>
          p.turned_pro && p.turned_pro >= currentYear - 3
        );
        break;
    }

    // Apply sort
    switch (sort) {
      case 'alphabetical':
        filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'world-rank':
        filtered.sort((a, b) => {
          const aRank = statsMap.get(a.id)?.fedex_rank || 9999;
          const bRank = statsMap.get(b.id)?.fedex_rank || 9999;
          return aRank - bRank;
        });
        break;
      case 'most-active':
        filtered.sort((a, b) => {
          const aEvents = statsMap.get(a.id)?.events_played || 0;
          const bEvents = statsMap.get(b.id)?.events_played || 0;
          return bEvents - aEvents;
        });
        break;
      case 'newest-pro':
        filtered.sort((a, b) => (b.turned_pro || 0) - (a.turned_pro || 0));
        break;
    }

    return filtered;
  }, [players, search, filter, sort, statsMap]);

  // Determine stat display based on sort
  const statDisplay = useMemo(() => {
    switch (sort) {
      case 'world-rank':
        return 'rank' as const;
      case 'most-active':
        return 'events' as const;
      default:
        return 'rank' as const;
    }
  }, [sort]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Featured carousel skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-40 h-48 bg-muted rounded-xl shrink-0" />
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-10 bg-muted rounded-lg w-full max-w-md" />

        {/* Filter skeleton */}
        <div className="h-10 bg-muted rounded-lg w-full" />

        {/* Rows skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!players || players.length === 0) {
    return <TourHubEmptyState variant="players" />;
  }

  return (
    <div className="space-y-5">
      {/* Featured Players Carousel */}
      {playerStats && playerStats.length > 0 && !search && filter === 'all' && (
        <div className="mb-6">
          <FeaturedPlayersCarousel players={players} stats={playerStats} />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md pt-1 pb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players, country, college..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/80 backdrop-blur-sm border-border/60"
        />
      </div>

      {/* Filter Chips */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-1 px-1">
        <PlayerFilterChips
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Sort Control + Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {processedPlayers.length} player{processedPlayers.length !== 1 ? 's' : ''}
        </p>
        <PlayerSortControl value={sort} onChange={setSort} />
      </div>

      {/* Player List - Editorial Rows */}
      {processedPlayers.length > 0 ? (
        <div className="divide-y divide-border/30">
          {processedPlayers.slice(0, 50).map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              stats={statsMap.get(player.id)}
              statDisplay={statDisplay}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No players match your filter.
          </p>
        </div>
      )}

      {/* Human pagination message */}
      {processedPlayers.length > 50 && (
        <p className="text-center text-sm text-muted-foreground/70 py-4">
          Scroll to explore the field, or search to find a specific player.
        </p>
      )}
    </div>
  );
}
