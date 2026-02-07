/**
 * CinematicLeadersTab - Apple-grade Premium Leaders Experience (Phase 5)
 * 
 * Light theme with dark cinematic podium cards
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { CinematicPodium } from '../cinematic/CinematicPodium';
import { StatsCategoryGrid } from '../cinematic/StatsCategoryGrid';
import { PodiumSkeleton, PlayerListSkeleton, CategoryGridSkeleton } from '../cinematic/CinematicSkeleton';
import { PlayersEmptyState } from '../players/PlayersEmptyState';
import { staggerContainerVariants, staggerItemVariants, pageVariants } from '../cinematic/animations';
import { cn } from '@/lib/utils';

interface LeaderCategory {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  getValue: (stats: any) => number | null;
  format: (value: number) => string;
  formatShort: (value: number) => string;
  sortOrder: 'desc' | 'asc';
  isWorldRank?: boolean;
  section: 'season' | 'stats';
}

// All categories
const leaderCategories: LeaderCategory[] = [
  // Season Performance
  { key: 'world_rank', label: 'World Ranking', shortLabel: 'World Rank', description: 'Official world golf ranking', getValue: (s) => s.raw_data?.statistics?.world_rank, format: (v) => `#${v}`, formatShort: (v) => `#${v}`, sortOrder: 'asc', isWorldRank: true, section: 'season' },
  { key: 'events_played', label: 'Events Played', shortLabel: 'Events', description: 'Most tournament appearances this season', getValue: (s) => s.events_played, format: (v) => `${v}`, formatShort: (v) => `${v}`, sortOrder: 'desc', section: 'season' },
  { key: 'cuts_made', label: 'Cuts Made', shortLabel: 'Cuts', description: 'Most weekends made this season', getValue: (s) => s.cuts_made, format: (v) => `${v}`, formatShort: (v) => `${v}`, sortOrder: 'desc', section: 'season' },
  { key: 'top_10', label: 'Top 10 Finishes', shortLabel: 'Top 10s', description: 'Most top 10 finishes this season', getValue: (s) => s.raw_data?.statistics?.top_10, format: (v) => `${v}`, formatShort: (v) => `${v}`, sortOrder: 'desc', section: 'season' },
  { key: 'earnings', label: 'Season Earnings', shortLabel: 'Earnings', description: 'Total prize money earned', getValue: (s) => s.raw_data?.statistics?.earnings, format: (v) => `$${(v / 1_000_000).toFixed(2)}M`, formatShort: (v) => `$${(v / 1_000_000).toFixed(1)}M`, sortOrder: 'desc', section: 'season' },
  // Ball Striking & Short Game
  { key: 'scoring_avg', label: 'Scoring Average', shortLabel: 'Scoring', description: 'Lowest average strokes per round', getValue: (s) => s.raw_data?.statistics?.scoring_avg, format: (v) => v.toFixed(3), formatShort: (v) => v.toFixed(2), sortOrder: 'asc', section: 'stats' },
  { key: 'drive_avg', label: 'Driving Distance', shortLabel: 'Distance', description: 'Longest average driving distance', getValue: (s) => s.raw_data?.statistics?.drive_avg, format: (v) => `${v.toFixed(1)} yds`, formatShort: (v) => `${v.toFixed(1)}`, sortOrder: 'desc', section: 'stats' },
  { key: 'drive_acc', label: 'Driving Accuracy', shortLabel: 'Accuracy', description: 'Highest fairway hit percentage', getValue: (s) => s.raw_data?.statistics?.drive_acc, format: (v) => `${v.toFixed(1)}%`, formatShort: (v) => `${v.toFixed(1)}%`, sortOrder: 'desc', section: 'stats' },
  { key: 'gir_pct', label: 'Greens in Regulation', shortLabel: 'GIR', description: 'Highest greens in regulation percentage', getValue: (s) => s.raw_data?.statistics?.gir_pct, format: (v) => `${v.toFixed(1)}%`, formatShort: (v) => `${v.toFixed(1)}%`, sortOrder: 'desc', section: 'stats' },
  { key: 'putt_avg', label: 'Putting Average', shortLabel: 'Putting', description: 'Lowest putts per hole', getValue: (s) => s.raw_data?.statistics?.putt_avg, format: (v) => v.toFixed(3), formatShort: (v) => v.toFixed(3), sortOrder: 'asc', section: 'stats' },
  { key: 'sand_saves_pct', label: 'Sand Saves', shortLabel: 'Sand Saves', description: 'Highest sand save percentage', getValue: (s) => s.raw_data?.statistics?.sand_saves_pct, format: (v) => `${v.toFixed(1)}%`, formatShort: (v) => `${v.toFixed(1)}%`, sortOrder: 'desc', section: 'stats' },
  { key: 'scrambling_pct', label: 'Scrambling', shortLabel: 'Scrambling', description: 'Highest scrambling percentage', getValue: (s) => s.raw_data?.statistics?.scrambling_pct, format: (v) => `${v.toFixed(1)}%`, formatShort: (v) => `${v.toFixed(1)}%`, sortOrder: 'desc', section: 'stats' },
];

// Light theme row component for leaderboard list
function LeaderRow({ 
  player, 
  rank, 
  value, 
  formatValue 
}: { 
  player: any; 
  rank: number; 
  value: number | null;
  formatValue: (v: number) => string;
}) {
  const photoUrl = resolvePhotoUrl(player?.photo_url);
  const displayValue = value !== null ? formatValue(value) : '—';
  
  return (
    <Link
      to={`/tourhub/player/${player?.id || ''}`}
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
        {/* Rank */}
        <span className="w-8 text-center text-base font-bold text-slate-400 tabular-nums">
          {rank}
        </span>
        
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          {photoUrl ? (
            <img 
              src={photoUrl}
              alt={player?.full_name || ''}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              {getInitials(player?.full_name || '')}
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-slate-900">
            {player?.full_name}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {toTitleCase(player?.country)}
          </p>
        </div>
        
        {/* Value */}
        <span className="text-lg font-bold text-slate-800 tabular-nums">
          {displayValue}
        </span>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}

export function CinematicLeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const initialCategory = useMemo(() => {
    if (categoryParam) {
      const found = leaderCategories.find(c => c.key === categoryParam);
      if (found) return found;
    }
    return leaderCategories[0];
  }, [categoryParam]);
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = statsLoading || worldRankLoading;

  // Sync category with URL
  useEffect(() => {
    if (categoryParam) {
      const found = leaderCategories.find(c => c.key === categoryParam);
      if (found && found.key !== selectedCategory.key) {
        setSelectedCategory(found);
      }
    }
  }, [categoryParam]);

  // Handle category change
  const handleCategoryChange = (categoryKey: string) => {
    const cat = leaderCategories.find(c => c.key === categoryKey);
    if (!cat || cat.key === selectedCategory.key) return;
    
    setIsTransitioning(true);
    setSelectedCategory(cat);
    
    setSearchParams(prev => {
      prev.set('tab', 'leaderboards');
      prev.set('category', cat.key);
      return prev;
    }, { replace: true });
    
    setTimeout(() => setIsTransitioning(false), 150);
  };

  // Get sorted players for selected category
  const rankedPlayers = useMemo(() => {
    if (selectedCategory.isWorldRank) {
      return worldRankedPlayers.slice(0, 50).map((p, idx) => ({
        id: p.playerId,
        player_id: p.playerId,
        player: p.player,
        displayRank: idx + 1,
        value: p.worldRank,
      }));
    }

    if (!playerStats) return [];

    return [...playerStats]
      .filter(s => {
        const value = selectedCategory.getValue(s);
        return value !== null && value !== undefined && s.player;
      })
      .sort((a, b) => {
        const aVal = selectedCategory.getValue(a) || 0;
        const bVal = selectedCategory.getValue(b) || 0;
        return selectedCategory.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, 50)
      .map((stat, idx) => ({
        id: stat.id,
        player_id: stat.player_id,
        player: stat.player,
        displayRank: idx + 1,
        value: selectedCategory.getValue(stat),
      }));
  }, [playerStats, selectedCategory, worldRankedPlayers]);

  const top3 = rankedPlayers.slice(0, 3);
  const restOfList = rankedPlayers.slice(3);

  if (isLoading) {
    return (
      <motion.div 
        className="space-y-6 py-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <CategoryGridSkeleton />
        <PodiumSkeleton />
        <PlayerListSkeleton count={10} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Category Grid - Light variant */}
      <StatsCategoryGrid
        selectedCategory={selectedCategory.key}
        onCategoryChange={handleCategoryChange}
        variant="light"
      />

      {/* Content with transition */}
      <div className={cn(
        "transition-opacity duration-150",
        isTransitioning ? "opacity-0" : "opacity-100"
      )}>
        {/* World Rank Official Badge - Light theme */}
        {selectedCategory.isWorldRank && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Info className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">
                Official World Golf Ranking
              </span>
            </div>
            <span className="text-xs text-slate-400">Updated weekly</span>
          </div>
        )}

        {/* Category description - Light theme */}
        {!selectedCategory.isWorldRank && (
          <p className="text-sm text-slate-500 mb-4">
            {selectedCategory.description}
          </p>
        )}

        {/* Cinematic Podium - Top 3 (keeps dark styling internally) */}
        {top3.length >= 3 && (
          <CinematicPodium
            players={top3}
            formatValue={selectedCategory.format}
            isWorldRank={selectedCategory.isWorldRank}
            className="mb-6"
          />
        )}

        {/* Rest of list - Light theme with staggered animations */}
        {restOfList.length > 0 ? (
          <motion.div 
            className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {restOfList.map((player, idx) => (
              <LeaderRow
                key={player.id}
                player={player.player}
                rank={idx + 4}
                value={player.value}
                formatValue={selectedCategory.formatShort}
              />
            ))}
          </motion.div>
        ) : rankedPlayers.length === 0 ? (
          <PlayersEmptyState 
            message="No Rankings Available"
            description="Rankings will unlock with live feeds."
          />
        ) : null}

        {/* Footer - Light theme */}
        <div className="text-center pt-6">
          <p className="text-xs text-slate-400">
            Season leaders computed from available tournament data
          </p>
        </div>
      </div>
    </div>
  );
}

export default CinematicLeadersTab;
