/**
 * PlayersTab - Redesigned Premium Players Experience (Phase 1A)
 * 
 * Features:
 * - Spotlight Reel: Cinematic edge-to-edge hero carousel
 * - Editorial Tabs: The Field / Elite / On Tour / Next Wave
 * - Identity Cards: Premium player rows with college deep-links
 * - Enhanced search placeholder
 * - 12px rhythm spacing
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings } from '../../hooks/useWorldRankings';
import { useCollegeLookup } from '../../hooks/useCollegeMedia';
import { TourHubEmptyState } from '../TourHubEmptyState';
import {
  SpotlightReel,
  EditorialTabs,
  type PlayerFilterType,
  PlayerSortControl,
  type PlayerSortType,
  IdentityCard,
  RegionChips,
  type RegionType,
  getPlayerRegion,
  getRegionLabel,
} from '../players';

// Tab context descriptions - Updated for editorial naming
const TAB_CONTEXT: Record<PlayerFilterType, { description: string; tooltip: string }> = {
  'all': {
    description: 'The complete PGA Tour field for the current season.',
    tooltip: 'Browse all players currently on the PGA Tour roster.',
  },
  'top-ranked': {
    description: 'The best in the world. Top 50 by Official World Golf Ranking.',
    tooltip: 'Players ranked highest in the Official World Golf Ranking.',
  },
  'most-active': {
    description: 'The grinders. Players with the most starts this season.',
    tooltip: 'Based on total events played in the 2025 season.',
  },
  'rookies': {
    description: 'The next generation. First-time Tour players making their mark.',
    tooltip: 'Includes players who earned Tour status recently.',
  },
};

// Default sort per tab
const TAB_DEFAULT_SORT: Record<PlayerFilterType, PlayerSortType> = {
  'all': 'alphabetical',
  'top-ranked': 'world-rank',
  'most-active': 'most-active',
  'rookies': 'newest-pro',
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
        // Show top 50 ranked players by world rank
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
        {/* Spotlight skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="-mx-4 px-4">
            <div className="flex gap-3 overflow-hidden">
              <div className="w-[85vw] max-w-[340px] min-w-[280px] h-[200px] bg-muted rounded-2xl shrink-0" />
              <div className="w-[85vw] max-w-[340px] min-w-[280px] h-[200px] bg-muted rounded-2xl shrink-0 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search skeleton */}
        <div className="h-11 bg-muted rounded-xl w-full" />

        {/* Tabs skeleton */}
        <div className="h-12 bg-muted rounded-xl w-full" />

        {/* Rows skeleton */}
        <div className="space-y-1">
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
    <div className="space-y-6 -mx-4 px-4 py-6 min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Spotlight Reel - Premium hero carousel */}
      {players && players.length > 0 && worldRankedPlayers.length > 0 && (
        <SpotlightReel 
          worldRankedPlayers={worldRankedPlayers} 
          players={players} 
        />
      )}

      {/* Search Bar - Matching design system */}
      <div className="relative pt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Search players, colleges, countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0] transition-all"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
        />
      </div>

      {/* Editorial Tabs - Segmented control matching Schedule page */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2" style={{ background: 'rgba(248, 250, 252, 0.95)', backdropFilter: 'blur(8px)' }}>
        <EditorialTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      </div>

      {/* Tab Context Description */}
      <div className="flex items-start gap-2">
        <p className="text-sm text-slate-500 leading-relaxed">
          {currentContext.description}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="shrink-0 p-0.5 text-slate-400 hover:text-slate-600 transition-colors">
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
        <p className="text-sm text-slate-500 font-medium">
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
        <p className="text-xs text-slate-400">
          Showing players from {getRegionLabel(region)}
        </p>
      )}

      {/* Player List - Identity Cards */}
      {hasNoRankingData ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-slate-600">
            World ranking data is currently unavailable.
          </p>
          <p className="text-xs text-slate-400">
            Check back later for updated rankings.
          </p>
        </div>
      ) : hasNoRegionResults ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-slate-600">
            No players found for this region and category.
          </p>
          <p className="text-xs text-slate-400">
            Try selecting a different region or category.
          </p>
        </div>
      ) : processedPlayers.length > 0 ? (
        <div className="space-y-0">
          {processedPlayers.slice(0, 200).map((player) => (
            <IdentityCard
              key={player.id}
              player={player}
              stats={statsMap.get(player.id)}
              college={getCollege(player.college)}
              statDisplay={statDisplay}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-slate-600">
            No players found
          </p>
          <p className="text-xs text-slate-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Human pagination message */}
      {processedPlayers.length > 200 && (
        <p className="text-center text-sm text-slate-400 py-6">
          Showing 200 of {processedPlayers.length} players. Use search to find specific players.
        </p>
      )}
    </div>
  );
}
