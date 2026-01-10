/**
 * PlayersTab - Redesigned Premium Players Experience
 * 
 * Features:
 * - Featured players carousel at top
 * - Search + filter chips with context descriptions
 * - Flat editorial rows with labelled metadata
 * - Regional grouping for All Players
 * - Sort control
 * - Human pagination messaging
 */

import { useState, useMemo } from 'react';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// Tab context descriptions
const TAB_CONTEXT: Record<PlayerFilterType, { description: string; tooltip: string }> = {
  'all': {
    description: 'The complete PGA Tour field for the current season.',
    tooltip: 'Browse all players currently on the PGA Tour roster.',
  },
  'top-ranked': {
    description: 'Players ranked highest in the Official World Golf Ranking.',
    tooltip: 'Top 50 players by FedEx Cup ranking.',
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

// Region grouping for better browsing
const REGIONS: Record<string, string[]> = {
  'United States': ['United States', 'USA', 'U.S.A.', 'US'],
  'Europe': ['England', 'Scotland', 'Ireland', 'Northern Ireland', 'Wales', 'Spain', 'France', 'Germany', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Portugal', 'Finland', 'Poland', 'Czech Republic'],
  'Asia-Pacific': ['Australia', 'Japan', 'South Korea', 'Korea', 'China', 'Taiwan', 'Thailand', 'Philippines', 'India', 'New Zealand', 'Singapore', 'Malaysia', 'Indonesia', 'Vietnam'],
};

function getRegion(country: string | null): string {
  if (!country) return 'International';
  const upperCountry = country.toUpperCase();
  
  for (const [region, countries] of Object.entries(REGIONS)) {
    if (countries.some(c => c.toUpperCase() === upperCountry)) {
      return region;
    }
  }
  return 'International';
}

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

  // Group players by region (only for 'all' filter without search)
  const groupedPlayers = useMemo(() => {
    if (filter !== 'all' || search.length >= 2) {
      return null; // Don't group when filtered or searching
    }

    const groups: Record<string, TourPlayer[]> = {
      'United States': [],
      'Europe': [],
      'Asia-Pacific': [],
      'International': [],
    };

    processedPlayers.forEach(player => {
      const region = getRegion(player.country);
      groups[region].push(player);
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, players]) => players.length > 0);
  }, [processedPlayers, filter, search]);

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

  // Check for empty filtered results (e.g., no ranking data)
  const hasNoRankingData = filter === 'top-ranked' && processedPlayers.length === 0;

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
      ) : processedPlayers.length > 0 ? (
        groupedPlayers ? (
          // Grouped by region (All Players without search)
          <div className="space-y-6">
            {groupedPlayers.map(([region, regionPlayers]) => (
              <div key={region}>
                {/* Region Header */}
                <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border/30">
                  <h3 className="text-sm font-medium text-foreground">
                    {region}
                  </h3>
                  <span className="text-xs text-muted-foreground/60">
                    {regionPlayers.length} player{regionPlayers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Region Players */}
                <div className="divide-y divide-border/20">
                  {regionPlayers.slice(0, 25).map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      stats={statsMap.get(player.id)}
                      statDisplay={statDisplay}
                    />
                  ))}
                </div>
                
                {regionPlayers.length > 25 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-2">
                    +{regionPlayers.length - 25} more players
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Flat list (filtered or searching)
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
        )
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            No players match this filter.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Try adjusting your search or switching categories.
          </p>
        </div>
      )}

      {/* Human pagination message */}
      {processedPlayers.length > 50 && !groupedPlayers && (
        <p className="text-center text-sm text-muted-foreground/70 py-4">
          Scroll to explore the field, or search to find a specific player.
        </p>
      )}
    </div>
  );
}
