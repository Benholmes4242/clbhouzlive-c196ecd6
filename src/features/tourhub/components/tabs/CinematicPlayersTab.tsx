/**
 * CinematicPlayersTab - Apple-grade Premium Players Experience (Phase 5)
 * 
 * Light theme with dark cinematic cards for World Top 5 showcase
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTourPlayers, useTourSeason, useTourPlayerStatistics, type TourPlayer, type TourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings } from '../../hooks/useWorldRankings';
import { CinematicWorldTop5 } from '../cinematic/CinematicWorldTop5';
import { PlayerListSkeleton, WorldRankShowcaseSkeleton } from '../cinematic/CinematicSkeleton';
import { CinematicEmptyState } from '../cinematic/CinematicEmptyState';
import { PlayerAvatar } from '../PlayerAvatar';
import { staggerContainerVariants, staggerItemVariants, pageVariants } from '../cinematic/animations';
import { cn } from '@/lib/utils';

type PlayerFilterType = 'all' | 'top-ranked' | 'most-active' | 'rookies';
type PlayerSortType = 'alphabetical' | 'world-rank' | 'most-active' | 'newest-pro';

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

// Default sort per tab
const TAB_DEFAULT_SORT: Record<PlayerFilterType, PlayerSortType> = {
  'all': 'alphabetical',
  'top-ranked': 'world-rank',
  'most-active': 'most-active',
  'rookies': 'newest-pro',
};

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Light theme Player Row with animation variants
function PlayerRow({ 
  player, 
  worldRank,
  eventsPlayed 
}: { 
  player: TourPlayer; 
  worldRank?: number | null;
  eventsPlayed?: number | null;
}) {
  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="group"
    >
      <motion.div
        variants={staggerItemVariants}
        className={cn(
          "flex items-center gap-4 py-4 px-4",
          "bg-white hover:bg-slate-50 transition-colors",
          "border-b border-slate-100"
        )}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
      >
        {/* Avatar */}
        <PlayerAvatar
          playerId={player.id}
          playerName={player.full_name}
          fallbackPhotoUrl={player.photo_url}
          size="lg"
          className="border-2 border-slate-200"
        />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-slate-900">
            {player.full_name}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {player.country ? toTitleCase(player.country) : ''}
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          {worldRank && worldRank > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800">#{worldRank}</p>
              <p className="text-xs text-slate-400">World</p>
            </div>
          )}
          {eventsPlayed && eventsPlayed > 0 && !worldRank && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800">{eventsPlayed}</p>
              <p className="text-xs text-slate-400">Events</p>
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}

export function CinematicPlayersTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlayerFilterType>('all');
  const [sort, setSort] = useState<PlayerSortType>('alphabetical');
  
  const { data: season } = useTourSeason();
  const { data: players, isLoading: playersLoading } = useTourPlayers();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = playersLoading || statsLoading || worldRankLoading;

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
        { ...s, worldRank: worldRankMap.get(s.player_id) ?? null }
      ])
    );
  }, [playerStats, worldRankedPlayers]);

  // Prepare world top 5 for showcase
  const worldTop5 = useMemo(() => {
    return worldRankedPlayers.slice(0, 5).map(wp => ({
      playerId: wp.playerId,
      playerName: wp.playerName,
      worldRank: wp.worldRank ?? 0,
      country: wp.country,
      photoUrl: wp.photoUrl,
      avgPoints: undefined,
    }));
  }, [worldRankedPlayers]);

  // Filter and sort players
  const processedPlayers = useMemo(() => {
    if (!players) return [];

    let filtered = [...players];

    // Apply search
    if (search && search.length >= 2) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(searchLower) ||
        p.country?.toLowerCase().includes(searchLower)
      );
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
  }, [players, search, filter, sort, statsMap]);

  // Loading state with new skeletons
  if (isLoading) {
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

  if (!players || players.length === 0) {
    return <CinematicEmptyState variant="players" />;
  }

  const currentContext = TAB_CONTEXT[filter];

  return (
    <div className="space-y-6 py-6">
      {/* World Top 5 Showcase - Keeps dark styling internally */}
      {worldTop5.length > 0 && (
        <CinematicWorldTop5 players={worldTop5} />
      )}

      {/* Search Bar - Light theme */}
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

      {/* Filter Tabs - Light theme segmented control */}
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

      {/* Context Description - Light theme */}
      <p className="text-sm text-slate-500 px-1">
        {currentContext.description}
      </p>

      {/* Player Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">
          {processedPlayers.length} player{processedPlayers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Player List - Light theme with staggered animations */}
      {processedPlayers.length > 0 ? (
        <motion.div 
          className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {processedPlayers.slice(0, 100).map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              worldRank={statsMap.get(player.id)?.worldRank}
              eventsPlayed={statsMap.get(player.id)?.events_played}
            />
          ))}
        </motion.div>
      ) : (
        <CinematicEmptyState variant="search" />
      )}

      {/* Pagination message */}
      {processedPlayers.length > 100 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Showing 100 of {processedPlayers.length} players. Use search to find specific players.
        </p>
      )}
    </div>
  );
}

export default CinematicPlayersTab;
