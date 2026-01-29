/**
 * PlayersTab - Premium Cinematic Players Experience
 * 
 * Features:
 * - Dark cinematic theme matching Overview/Schedule
 * - Hero carousel with top 10 world ranked players
 * - Glass morphism player cards
 * - Editorial tabs with premium styling
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, Info, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings } from '../../hooks/useWorldRankings';
import { useCollegeLookup } from '../../hooks/useCollegeMedia';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { GlassCard } from '../premium';
import { PlayersHeroCarousel, PremiumPlayerCard } from '../players-premium';
import {
  EditorialTabs,
  type PlayerFilterType,
  PlayerSortControl,
  type PlayerSortType,
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

  // Loading state - dark theme
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-6">
        <div className="h-[180px] bg-white/5 rounded-2xl" />
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl" />
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
    <div className="space-y-6 py-6">
      {/* Hero Carousel - Top 10 World Ranked */}
      {worldRankedPlayers.length > 0 && (
        <PlayersHeroCarousel players={worldRankedPlayers} />
      )}

      {/* Search Bar - Glass style */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        <Search className="absolute left-8 sm:left-10 lg:left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search players, colleges, countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-th-accent/50 focus:border-th-accent/50 transition-all backdrop-blur-sm"
        />
      </div>

      {/* Editorial Tabs */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-2 bg-th-bg-canvas/95 backdrop-blur-md">
        <EditorialTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      </div>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Context + Sort Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 flex-1">
            <p className="text-sm text-white/60 leading-relaxed">
              {currentContext.description}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="shrink-0 p-0.5 text-white/40 hover:text-white/60 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] bg-black/90 border-white/10">
                  <p className="text-xs text-white">{currentContext.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <PlayerSortControl value={sort} onChange={setSort} />
        </div>

        {/* Count + Region Chips */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {processedPlayers.length} player{processedPlayers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <RegionChips
          activeRegion={region}
          onRegionChange={setRegion}
        />

        {region !== 'all' && processedPlayers.length > 0 && (
          <p className="text-xs text-white/40">
            Showing players from {getRegionLabel(region)}
          </p>
        )}

        {/* Player List - Premium Cards */}
        {hasNoRankingData ? (
          <GlassCard className="p-8 text-center">
            <p className="text-white/60">World ranking data is currently unavailable.</p>
            <p className="text-xs text-white/40 mt-2">Check back later for updated rankings.</p>
          </GlassCard>
        ) : hasNoRegionResults ? (
          <GlassCard className="p-8 text-center">
            <p className="text-white/60">No players found for this region and category.</p>
            <p className="text-xs text-white/40 mt-2">Try selecting a different region or category.</p>
          </GlassCard>
        ) : processedPlayers.length > 0 ? (
          <div className="space-y-3">
            {processedPlayers.slice(0, 100).map((player, idx) => (
              <PremiumPlayerCard
                key={player.id}
                player={player}
                stats={statsMap.get(player.id)}
                college={getCollege(player.college)}
                statDisplay={statDisplay}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-white/60">No players found</p>
            <p className="text-xs text-white/40 mt-2">Try adjusting your search or filters</p>
          </GlassCard>
        )}

        {/* Pagination message */}
        {processedPlayers.length > 100 && (
          <p className="text-center text-sm text-white/40 py-6">
            Showing 100 of {processedPlayers.length} players. Use search to find specific players.
          </p>
        )}
      </div>
    </div>
  );
}
