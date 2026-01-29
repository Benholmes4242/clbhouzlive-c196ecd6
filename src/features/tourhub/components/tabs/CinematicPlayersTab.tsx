/**
 * CinematicPlayersTab - Apple-grade Premium Players Experience
 * 
 * Features:
 * - Elite: Top 50 from sr_world_rankings with avg OWGR points
 * - On Tour: Players with most events from sr_player_statistics
 * - Premium player cards with world rank badges and country flags
 */

import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer } from '../../hooks/useTourHubData';
import { useElitePlayers } from '../../hooks/useElitePlayers';
import { useActivePlayers } from '../../hooks/useActivePlayers';
import { CinematicWorldTop5 } from '../cinematic/CinematicWorldTop5';
import { PlayerListSkeleton, WorldRankShowcaseSkeleton } from '../cinematic/CinematicSkeleton';
import { CinematicEmptyState } from '../cinematic/CinematicEmptyState';
import { PremiumPlayerCard, PremiumPlayerRow } from '../cinematic/PremiumPlayerCard';
import { staggerContainerVariants, pageVariants } from '../cinematic/animations';
import { cn } from '@/lib/utils';

type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';

// Tab context descriptions
const TAB_CONTEXT: Record<PlayerFilterType, { description: string }> = {
  'all': { description: 'The complete PGA Tour field for the current season.' },
  'top-ranked': { description: 'The best in the world. Top 50 by Official World Golf Ranking.' },
  'most-active': { description: 'The grinders. Players with the most starts this season.' },
  'rookies': { description: 'The next generation. First-time Tour players making their mark.' },
};

const FILTER_LABELS: Record<PlayerFilterType, string> = {
  'all': 'The Field',
  'top-ranked': 'Elite',
  'most-active': 'On Tour',
  'rookies': 'Next Wave',
};

export function CinematicPlayersTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlayerFilterType>('all');
  
  // Data hooks
  const { data: season } = useTourSeason();
  const { data: players, isLoading: playersLoading } = useTourPlayers();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { data: elitePlayers, isLoading: eliteLoading } = useElitePlayers(50);
  const { data: activePlayers, isLoading: activeLoading } = useActivePlayers(10, 100);

  // Determine loading state based on current filter
  const isLoading = useMemo(() => {
    switch (filter) {
      case 'top-ranked':
        return eliteLoading;
      case 'most-active':
        return activeLoading;
      default:
        return playersLoading || statsLoading;
    }
  }, [filter, eliteLoading, activeLoading, playersLoading, statsLoading]);

  // Create stats lookup map for 'all' and 'rookies' tabs
  const statsMap = useMemo(() => {
    if (!playerStats) return new Map<string, { eventsPlayed: number | null; worldRank: number | null }>();
    
    // Create world rank lookup from elite players
    const worldRankMap = new Map(
      elitePlayers?.map(p => [p.playerId, p.worldRank]) || []
    );
    
    return new Map(
      playerStats.map(s => [
        s.player_id, 
        { 
          eventsPlayed: s.events_played,
          worldRank: worldRankMap.get(s.player_id) ?? null 
        }
      ])
    );
  }, [playerStats, elitePlayers]);

  // World Top 5 from elite players
  const worldTop5 = useMemo(() => {
    if (!elitePlayers) return [];
    return elitePlayers.slice(0, 5).map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      worldRank: p.worldRank,
      country: p.country,
      photoUrl: p.photoUrl,
      avgPoints: p.avgPoints,
    }));
  }, [elitePlayers]);

  // Filter and process players based on current tab
  const processedData = useMemo(() => {
    // Apply search filter helper
    const matchesSearch = (name: string, country: string | null) => {
      if (!search || search.length < 2) return true;
      const searchLower = search.toLowerCase();
      return name.toLowerCase().includes(searchLower) ||
             country?.toLowerCase().includes(searchLower);
    };

    switch (filter) {
      case 'top-ranked':
        // Use elite players directly from sr_world_rankings
        if (!elitePlayers) return { type: 'elite' as const, data: [] };
        const filteredElite = elitePlayers.filter(p => 
          matchesSearch(p.playerName, p.country)
        );
        return { type: 'elite' as const, data: filteredElite };
      
      case 'most-active':
        // Use active players from sr_player_statistics
        if (!activePlayers) return { type: 'active' as const, data: [] };
        const filteredActive = activePlayers.filter(p => 
          matchesSearch(p.playerName, p.country)
        );
        return { type: 'active' as const, data: filteredActive };
      
      case 'rookies':
        // Filter players by turned_pro year
        if (!players) return { type: 'default' as const, data: [] };
        const currentYear = new Date().getFullYear();
        const rookies = players
          .filter(p => 
            p.turned_pro && p.turned_pro >= currentYear - 3 &&
            matchesSearch(p.full_name, p.country)
          )
          .sort((a, b) => (b.turned_pro || 0) - (a.turned_pro || 0));
        return { type: 'default' as const, data: rookies };
      
      default:
        // All players
        if (!players) return { type: 'default' as const, data: [] };
        const filtered = players.filter(p => 
          matchesSearch(p.full_name, p.country)
        ).sort((a, b) => a.full_name.localeCompare(b.full_name));
        return { type: 'default' as const, data: filtered };
    }
  }, [filter, search, elitePlayers, activePlayers, players]);

  // Get count for display
  const displayCount = processedData.data.length;

  // Loading state
  if (isLoading && displayCount === 0) {
    return (
      <motion.div 
        className="space-y-6 py-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <WorldRankShowcaseSkeleton />
        <div className="pt-4">
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <PlayerListSkeleton count={8} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* World Top 5 Showcase */}
      {worldTop5.length > 0 && filter !== 'most-active' && (
        <CinematicWorldTop5 players={worldTop5} />
      )}

      {/* Search Bar */}
      <div className="relative pt-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search players, countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full h-12 pl-11 pr-4",
            "bg-white border border-slate-200",
            "rounded-xl text-sm text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300",
            "transition-all"
          )}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center rounded-xl bg-slate-100 p-1">
        {(Object.keys(FILTER_LABELS) as PlayerFilterType[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all",
              filter === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Context Description */}
      <p className="text-sm text-slate-500 px-1">
        {TAB_CONTEXT[filter].description}
      </p>

      {/* Player Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">
          {displayCount} player{displayCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Player Cards - Different rendering based on type */}
      {displayCount > 0 ? (
        <motion.div 
          className="space-y-3"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
          key={filter} // Re-animate on filter change
        >
          {processedData.type === 'elite' && (
            // Elite players with premium cards
            processedData.data.slice(0, 50).map((player) => (
              <PremiumPlayerCard
                key={player.playerId}
                playerId={player.playerId}
                playerName={player.playerName}
                country={player.country}
                countryCode={player.countryCode}
                photoUrl={player.photoUrl}
                worldRank={player.worldRank}
                avgPoints={player.avgPoints}
                rankChange={player.rankChange}
                variant="elite"
              />
            ))
          )}
          
          {processedData.type === 'active' && (
            // Active players with events count
            processedData.data.slice(0, 100).map((player) => (
              <PremiumPlayerCard
                key={player.playerId}
                playerId={player.playerId}
                playerName={player.playerName}
                country={player.country}
                countryCode={player.countryCode}
                photoUrl={player.photoUrl}
                eventsPlayed={player.eventsPlayed}
                variant="active"
              />
            ))
          )}
          
          {processedData.type === 'default' && (
            // Default players (all/rookies) with row style in card container
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              {(processedData.data as TourPlayer[]).slice(0, 100).map((player) => (
                <PremiumPlayerRow
                  key={player.id}
                  playerId={player.id}
                  playerName={player.full_name}
                  country={player.country}
                  countryCode={player.country_code}
                  photoUrl={player.photo_url}
                  worldRank={statsMap.get(player.id)?.worldRank}
                  eventsPlayed={statsMap.get(player.id)?.eventsPlayed}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <CinematicEmptyState 
          variant="search" 
          description={search ? 'Try adjusting your search terms.' : undefined}
        />
      )}

      {/* Pagination message */}
      {displayCount > 100 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Showing 100 of {displayCount} players. Use search to find specific players.
        </p>
      )}
    </div>
  );
}

export default CinematicPlayersTab;
