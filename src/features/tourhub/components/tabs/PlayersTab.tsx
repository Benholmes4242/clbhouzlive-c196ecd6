/**
 * PlayersTab - World-Class Players Experience
 * 
 * Features:
 * - "Players of the Season" narrative header
 * - Prestige World Rankings carousel with medal tints
 * - Mode-switch tabs (not just filters)
 * - Gamified context descriptions per tab
 * - College crest tiles for rivalry engagement
 * - Premium search and sort controls
 */

import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings } from '../../hooks/useWorldRankings';
import { useCollegeLookup } from '../../hooks/useCollegeMedia';
import { TourHubEmptyState } from '../TourHubEmptyState';
import {
  WorldRankingsCarousel,
  PlayerFilterChips,
  type PlayerFilterType,
  PlayerSortControl,
  type PlayerSortType,
  PlayerRow,
  RegionChips,
  type RegionType,
  getPlayerRegion,
  getRegionLabel,
} from '../players';

// Gamified context descriptions per tab
const TAB_CONTEXT: Record<PlayerFilterType, { description: string }> = {
  'all': {
    description: 'Every player in the field — discover where they\'re from, and who they represent.',
  },
  'top-ranked': {
    description: 'The highest-ranked players in the world right now.',
  },
  'most-active': {
    description: 'The grinders — players with the most appearances this season.',
  },
  'rookies': {
    description: 'First-year names to watch. The future starts here.',
  },
};

// Default sort per tab
const TAB_DEFAULT_SORT: Record<PlayerFilterType, PlayerSortType> = {
  'all': 'alphabetical',
  'top-ranked': 'world-rank',
  'most-active': 'alphabetical',
  'rookies': 'alphabetical',
};

export function PlayersTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlayerFilterType>('all');
  const [sort, setSort] = useState<PlayerSortType>('alphabetical');
  const [region, setRegion] = useState<RegionType>('all');
  
  const { data: season } = useTourSeason();
  const { data: players, isLoading: playersLoading } = useTourPlayers();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();
  const { getCollege, isLoading: collegeLoading } = useCollegeLookup();

  const isLoading = playersLoading || statsLoading || worldRankLoading || collegeLoading;

  // Auto-set sort when filter changes
  useEffect(() => {
    setSort(TAB_DEFAULT_SORT[filter]);
  }, [filter]);

  // Create stats lookup map with world rank data
  const statsMap = useMemo(() => {
    if (!playerStats) return new Map<string, TourPlayerStatistics & { worldRank?: number | null }>();
    
    const worldRankMap = new Map(
      worldRankedPlayers.map(p => [p.playerId, p.worldRank])
    );
    
    return new Map(
      playerStats.map(s => [
        s.player_id, 
        { 
          ...s, 
          worldRank: worldRankMap.get(s.player_id) ?? null 
        }
      ])
    );
  }, [playerStats, worldRankedPlayers]);

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

    // Apply region filter
    if (region !== 'all') {
      filtered = filtered.filter(p => getPlayerRegion(p.country) === region);
    }

    // Apply category filter
    switch (filter) {
      case 'top-ranked':
        filtered = filtered.filter(p => {
          const stats = statsMap.get(p.id);
          const worldRank = stats?.worldRank;
          return typeof worldRank === 'number' && worldRank >= 1;
        });
        filtered.sort((a, b) => {
          const aRank = statsMap.get(a.id)?.worldRank ?? 9999;
          const bRank = statsMap.get(b.id)?.worldRank ?? 9999;
          return aRank - bRank;
        });
        filtered = filtered.slice(0, 50);
        break;
      case 'most-active':
        filtered = filtered.filter(p => {
          const stats = statsMap.get(p.id);
          return stats?.events_played && stats.events_played >= 10;
        });
        break;
      case 'rookies':
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
          const aRank = statsMap.get(a.id)?.worldRank;
          const bRank = statsMap.get(b.id)?.worldRank;
          const aValid = typeof aRank === 'number' && aRank >= 1;
          const bValid = typeof bRank === 'number' && bRank >= 1;
          
          if (aValid && bValid) return (aRank || 9999) - (bRank || 9999);
          if (aValid) return -1;
          if (bValid) return 1;
          return a.full_name.localeCompare(b.full_name);
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
  }, [players, search, filter, sort, region, statsMap]);

  // Determine stat display based on filter/sort
  const statDisplay = useMemo(() => {
    if (filter === 'top-ranked' || sort === 'world-rank') {
      return 'rank' as const;
    }
    if (filter === 'most-active' || sort === 'most-active') {
      return 'events' as const;
    }
    return 'rank' as const;
  }, [filter, sort]);
  
  const currentContext = TAB_CONTEXT[filter];

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!players) return { all: 0, topRanked: 0, mostActive: 0, rookies: 0 };
    
    const currentYear = new Date().getFullYear();
    const topRankedCount = Math.min(50, worldRankedPlayers.length);
    const mostActiveCount = players.filter(p => {
      const stats = statsMap.get(p.id);
      return stats?.events_played && stats.events_played >= 10;
    }).length;
    const rookiesCount = players.filter(p => 
      p.turned_pro && p.turned_pro >= currentYear - 3
    ).length;
    
    return {
      all: players.length,
      topRanked: topRankedCount,
      mostActive: mostActiveCount,
      rookies: rookiesCount,
    };
  }, [players, worldRankedPlayers, statsMap]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[120px] h-36 bg-muted rounded-2xl shrink-0" />
          ))}
        </div>
        <div className="h-11 bg-muted rounded-xl w-full max-w-md" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!players || players.length === 0) {
    return <TourHubEmptyState variant="players" />;
  }

  const hasNoRankingData = filter === 'top-ranked' && processedPlayers.length === 0 && region === 'all';
  const hasNoRegionResults = processedPlayers.length === 0 && region !== 'all';

  return (
    <div className="min-h-screen">
      {/* Page Header - Narrative framing */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Players of the Season
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-[70%]">
          Search, compare, and follow the names shaping the year — and the colleges behind them.
        </p>
      </div>

      {/* World Rankings Carousel - Prestige styling */}
      {players && players.length > 0 && worldRankedPlayers.length > 0 && (
        <div className="mb-6">
          <WorldRankingsCarousel 
            worldRankedPlayers={worldRankedPlayers} 
            players={players} 
          />
        </div>
      )}

      {/* Search Bar - Taller, softer, no hard border */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          placeholder="Search players, countries, colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-11 bg-muted/40 border-0 rounded-xl focus:ring-2 focus:ring-border/50 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Mode-Switch Filter Tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-1 px-1 py-1">
        <PlayerFilterChips
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      </div>

      {/* Tab Context Description - Gamified */}
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">
        {currentContext.description}
      </p>

      {/* Sort Control + Count - Cleaner */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground/60">
          {processedPlayers.length} player{processedPlayers.length !== 1 ? 's' : ''}
        </p>
        <PlayerSortControl value={sort} onChange={setSort} />
      </div>

      {/* Region Chips - Pill style */}
      <RegionChips
        activeRegion={region}
        onRegionChange={setRegion}
      />

      {/* Region active helper */}
      {region !== 'all' && processedPlayers.length > 0 && (
        <p className="text-xs text-muted-foreground/50 mt-2 mb-2">
          Showing players from {getRegionLabel(region)}
        </p>
      )}

      {/* Player List */}
      <div className="mt-4">
        {hasNoRankingData ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-muted-foreground">
              World ranking data is currently unavailable.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Check back later for updated rankings.
            </p>
          </div>
        ) : hasNoRegionResults ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-muted-foreground">
              No players found for this region and category.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Try selecting a different region or category.
            </p>
          </div>
        ) : processedPlayers.length > 0 ? (
          <div className="space-y-0">
            {processedPlayers.slice(0, 200).map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                stats={statsMap.get(player.id)}
                college={getCollege(player.college)}
                statDisplay={statDisplay}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-muted-foreground">
              No players found
            </p>
            <p className="text-xs text-muted-foreground/60">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Human pagination message */}
        {processedPlayers.length > 200 && (
          <p className="text-center text-xs text-muted-foreground/50 py-6">
            Showing 200 of {processedPlayers.length} players. Use search to find specific players.
          </p>
        )}
      </div>
    </div>
  );
}
