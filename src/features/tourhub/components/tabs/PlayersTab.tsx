/**
 * PlayersTab - Redesigned Premium Players Experience
 * 
 * Features:
 * - World Rankings carousel at top (always visible)
 * - Search + filter chips with context descriptions
 * - Region chips for geographic filtering
 * - Flat editorial rows with college gamification
 * - Auto-sort by tab (Top Ranked = World Rank)
 * - Human pagination messaging
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// Tab context descriptions
const TAB_CONTEXT: Record<PlayerFilterType, { description: string; tooltip: string }> = {
  'all': {
    description: 'The complete PGA Tour field for the current season.',
    tooltip: 'Browse all players currently on the PGA Tour roster.',
  },
  'top-ranked': {
    description: 'Players ranked highest in the Official World Golf Ranking.',
    tooltip: 'Top 50 players by Official World Golf Ranking.',
  },
  'most-active': {
    description: 'Players with the most tournament appearances this season.',
    tooltip: 'Based on total events played in the 2025 season.',
  },
  'rookies': {
    description: 'Players in their first PGA Tour season.',
    tooltip: 'Includes players who turned professional recently or earned Tour status for the first time.',
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
    
    // Create a map of player IDs to their world rank from unified hook
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
        // Show top 50 ranked players by world rank (no upper limit restriction)
        filtered = filtered.filter(p => {
          const stats = statsMap.get(p.id);
          const worldRank = stats?.worldRank;
          return typeof worldRank === 'number' && worldRank >= 1;
        });
        // Sort by rank and take top 50
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
        // Sort by world rank (valid ranks first ascending, then unranked)
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

  // Calculate filter counts - MUST be before any early returns
  const filterCounts = useMemo(() => {
    if (!players) return { all: 0, topRanked: 0, mostActive: 0, rookies: 0 };
    
    const currentYear = new Date().getFullYear();
    
    // Top ranked: players with valid world rank
    const topRankedCount = Math.min(50, worldRankedPlayers.length);
    
    // Most active: events_played >= 10
    const mostActiveCount = players.filter(p => {
      const stats = statsMap.get(p.id);
      return stats?.events_played && stats.events_played >= 10;
    }).length;
    
    // Rookies: turned pro in last 3 years
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
        {/* World Rankings skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[100px] h-32 bg-muted rounded-xl shrink-0" />
            ))}
          </div>
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

  // Check for empty filtered results
  const hasNoRankingData = filter === 'top-ranked' && processedPlayers.length === 0 && region === 'all';
  const hasNoRegionResults = processedPlayers.length === 0 && region !== 'all';

  return (
    <div className="space-y-5 bg-[#F8FAFC] -mx-4 px-4 py-6 min-h-screen">
      {/* World Rankings Carousel - ALWAYS visible (no filter/search/region restrictions) */}
      {players && players.length > 0 && worldRankedPlayers.length > 0 && (
        <div className="mb-4">
          <WorldRankingsCarousel 
            worldRankedPlayers={worldRankedPlayers} 
            players={players} 
          />
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

      {/* Filter Chips with counts */}
      <div className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur-sm -mx-1 px-1 py-2">
        <PlayerFilterChips
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      </div>

      {/* Tab Context Description */}
      <div className="flex items-start gap-2 pb-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {currentContext.description}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="shrink-0 p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px]">
              <p className="text-xs">{currentContext.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Sort Control + Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {processedPlayers.length} player{processedPlayers.length !== 1 ? 's' : ''}
        </p>
        <PlayerSortControl value={sort} onChange={setSort} />
      </div>

      {/* Region Chips */}
      <RegionChips
        activeRegion={region}
        onRegionChange={setRegion}
      />

      {/* Region active helper text */}
      {region !== 'all' && processedPlayers.length > 0 && (
        <p className="text-xs text-muted-foreground/70">
          Showing players from {getRegionLabel(region)}
        </p>
      )}

      {/* Player List */}
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
        // Flat list with subtle dividers
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
        <p className="text-center text-sm text-muted-foreground/70 py-4">
          Showing 200 of {processedPlayers.length} players. Use search to find specific players.
        </p>
      )}
    </div>
  );
}
