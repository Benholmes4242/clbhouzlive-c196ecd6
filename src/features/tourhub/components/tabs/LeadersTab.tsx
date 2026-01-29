/**
 * LeadersTab - Premium Cinematic Leaders Experience
 * 
 * Dark theme with glass morphism, premium podium display,
 * and category tabs matching the Tour Hub design system
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, Gauge, Calendar, DollarSign, Globe, Info, Zap, Crosshair, Circle, Flag, Sun, RefreshCw, Scissors, Crown } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useWorldRankings, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { GlassCard, RankBadge } from '../premium';
import { PlayerAvatar } from '../PlayerAvatar';
import { cn } from '@/lib/utils';

interface LeaderCategory {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  getValue: (stats: any) => number | null;
  format: (value: number) => string;
  formatShort: (value: number) => string;
  sortOrder: 'desc' | 'asc';
  isWorldRank?: boolean;
  section: 'season' | 'stats';
}

// Season Performance categories
const seasonCategories: LeaderCategory[] = [
  {
    key: 'world_rank',
    label: 'World Ranking',
    shortLabel: 'World Rank',
    description: 'Official world golf ranking',
    icon: <Globe className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.world_rank,
    format: (v) => `#${v}`,
    formatShort: (v) => `#${v}`,
    sortOrder: 'asc',
    isWorldRank: true,
    section: 'season',
  },
  {
    key: 'events_played',
    label: 'Events Played',
    shortLabel: 'Events',
    description: 'Most tournament appearances this season',
    icon: <Calendar className="w-3.5 h-3.5" />,
    getValue: (s) => s.events_played,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'cuts_made',
    label: 'Cuts Made',
    shortLabel: 'Cuts',
    description: 'Most weekends made this season',
    icon: <Scissors className="w-3.5 h-3.5" />,
    getValue: (s) => s.cuts_made,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'top_10',
    label: 'Top 10 Finishes',
    shortLabel: 'Top 10s',
    description: 'Most top 10 finishes this season',
    icon: <Trophy className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.top_10,
    format: (v) => `${v}`,
    formatShort: (v) => `${v}`,
    sortOrder: 'desc',
    section: 'season',
  },
  {
    key: 'earnings',
    label: 'Season Earnings',
    shortLabel: 'Earnings',
    description: 'Total prize money earned',
    icon: <DollarSign className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.earnings,
    format: (v) => `$${(v / 1_000_000).toFixed(2)}M`,
    formatShort: (v) => `$${(v / 1_000_000).toFixed(1)}M`,
    sortOrder: 'desc',
    section: 'season',
  },
];

// Ball Striking & Short Game categories
const statsCategories: LeaderCategory[] = [
  {
    key: 'scoring_avg',
    label: 'Scoring Average',
    shortLabel: 'Scoring',
    description: 'Lowest average strokes per round',
    icon: <Gauge className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.scoring_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(2),
    sortOrder: 'asc',
    section: 'stats',
  },
  {
    key: 'drive_avg',
    label: 'Driving Distance',
    shortLabel: 'Distance',
    description: 'Longest average driving distance',
    icon: <Zap className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.drive_avg,
    format: (v) => `${v.toFixed(1)} yds`,
    formatShort: (v) => `${v.toFixed(1)}`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'drive_acc',
    label: 'Driving Accuracy',
    shortLabel: 'Accuracy',
    description: 'Highest fairway hit percentage',
    icon: <Crosshair className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.drive_acc,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'gir_pct',
    label: 'Greens in Regulation',
    shortLabel: 'GIR',
    description: 'Highest greens in regulation percentage',
    icon: <Circle className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.gir_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'putt_avg',
    label: 'Putting Average',
    shortLabel: 'Putting',
    description: 'Lowest putts per hole',
    icon: <Flag className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.putt_avg,
    format: (v) => v.toFixed(3),
    formatShort: (v) => v.toFixed(3),
    sortOrder: 'asc',
    section: 'stats',
  },
  {
    key: 'sand_saves_pct',
    label: 'Sand Saves',
    shortLabel: 'Sand',
    description: 'Highest sand save percentage',
    icon: <Sun className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.sand_saves_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
  {
    key: 'scrambling_pct',
    label: 'Scrambling',
    shortLabel: 'Scramble',
    description: 'Highest scrambling percentage',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    getValue: (s) => s.raw_data?.statistics?.scrambling_pct,
    format: (v) => `${v.toFixed(1)}%`,
    formatShort: (v) => `${v.toFixed(1)}%`,
    sortOrder: 'desc',
    section: 'stats',
  },
];

const leaderCategories: LeaderCategory[] = [...seasonCategories, ...statsCategories];

export function LeadersTab() {
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
  const scrollRef = useRef<number>(0);
  
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);
  const { rankedOnly: worldRankedPlayers, isLoading: worldRankLoading } = useWorldRankings();

  const isLoading = statsLoading || worldRankLoading;

  useEffect(() => {
    if (categoryParam) {
      const found = leaderCategories.find(c => c.key === categoryParam);
      if (found && found.key !== selectedCategory.key) {
        setSelectedCategory(found);
      }
    }
  }, [categoryParam]);

  const handleCategoryChange = (cat: LeaderCategory) => {
    if (cat.key === selectedCategory.key) return;
    scrollRef.current = window.scrollY;
    setIsTransitioning(true);
    setSelectedCategory(cat);
    
    setSearchParams(prev => {
      prev.set('tab', 'leaderboards');
      prev.set('category', cat.key);
      return prev;
    }, { replace: true });
    
    setTimeout(() => setIsTransitioning(false), 150);
  };

  useEffect(() => {
    if (!isTransitioning && scrollRef.current > 0) {
      window.scrollTo(0, scrollRef.current);
    }
  }, [isTransitioning]);

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
        if (selectedCategory.key === 'world_rank') {
          return value !== null && value !== undefined && value > 0 && s.player;
        }
        return value !== null && value !== undefined && s.player;
      })
      .sort((a, b) => {
        const aVal = selectedCategory.getValue(a) || 0;
        const bVal = selectedCategory.getValue(b) || 0;
        
        if (selectedCategory.key === 'world_rank') {
          const aValid = aVal >= 1;
          const bValid = bVal >= 1;
          if (aValid && bValid) return aVal - bVal;
          if (aValid) return -1;
          if (bValid) return 1;
          return 0;
        }
        
        return selectedCategory.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, 50)
      .map((stat, idx) => ({
        id: stat.id,
        player_id: stat.player_id,
        player: stat.player,
        displayRank: idx + 1,
        value: selectedCategory.getValue(stat),
        raw: stat,
      }));
  }, [playerStats, selectedCategory, worldRankedPlayers]);

  const top3 = rankedPlayers.slice(0, 3);
  const restOfList = rankedPlayers.slice(3);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-6 px-4 sm:px-6 lg:px-8">
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="h-12 bg-white/5 rounded-xl" />
        <div className="flex justify-center gap-4 py-8">
          <div className="w-24 h-40 bg-white/5 rounded-2xl" />
          <div className="w-32 h-48 bg-white/5 rounded-2xl" />
          <div className="w-24 h-40 bg-white/5 rounded-2xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      {/* Category Tabs - Glass style */}
      <div className="space-y-4" role="tablist" aria-label="Leaderboard categories">
        {/* Season Performance */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Season Performance
          </p>
          <div className="flex items-stretch rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm p-1">
            {seasonCategories.map((cat) => {
              const isSelected = selectedCategory.key === cat.key;
              return (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-all duration-200 rounded-lg",
                    isSelected 
                      ? "bg-white/15 text-white shadow-sm" 
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {cat.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ball Striking & Short Game */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Ball Striking & Short Game
          </p>
          <div className="flex items-stretch rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm p-1">
            {statsCategories.map((cat) => {
              const isSelected = selectedCategory.key === cat.key;
              return (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-all duration-200 rounded-lg",
                    isSelected 
                      ? "bg-white/15 text-white shadow-sm" 
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {cat.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-opacity duration-150",
        isTransitioning ? "opacity-0" : "opacity-100"
      )}>
        {/* Category Badge */}
        {selectedCategory.isWorldRank ? (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Info className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                Official World Golf Ranking
              </span>
            </div>
            <span className="text-xs text-white/40">Updated weekly</span>
          </div>
        ) : (
          <p className="text-sm text-white/60 mb-6">
            {selectedCategory.description}
          </p>
        )}

        {/* Premium Podium - Top 3 */}
        {top3.length >= 3 && (
          <div className="flex justify-center items-end gap-3 mb-8 py-4">
            {/* 2nd Place */}
            <PodiumSlot 
              player={top3[1]} 
              rank={2} 
              category={selectedCategory}
              size="md"
            />
            
            {/* 1st Place - Elevated */}
            <PodiumSlot 
              player={top3[0]} 
              rank={1} 
              category={selectedCategory}
              size="lg"
            />
            
            {/* 3rd Place */}
            <PodiumSlot 
              player={top3[2]} 
              rank={3} 
              category={selectedCategory}
              size="md"
            />
          </div>
        )}

        {/* Rest of List */}
        {restOfList.length > 0 && (
          <div className="space-y-2">
            {restOfList.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
              >
                <LeaderRow 
                  player={player} 
                  rank={idx + 4} 
                  category={selectedCategory}
                />
              </motion.div>
            ))}
          </div>
        )}

        {rankedPlayers.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-white/60">No data available for this category yet.</p>
            <p className="text-xs text-white/40 mt-2">Rankings will appear with live data.</p>
          </GlassCard>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-2">
          <p className="text-xs text-white/30">
            Season leaders computed from available tournament data
          </p>
        </div>
      </div>
    </div>
  );
}

// Podium slot component
interface PodiumSlotProps {
  player: {
    id: string;
    player_id: string;
    player?: {
      full_name: string;
      country?: string | null;
      photo_url?: string | null;
    };
    value: number | null;
  };
  rank: 1 | 2 | 3;
  category: LeaderCategory;
  size: 'lg' | 'md';
}

function PodiumSlot({ player, rank, category, size }: PodiumSlotProps) {
  const photoUrl = resolvePhotoUrl(player.player?.photo_url);
  const isChamp = rank === 1;
  
  // Metallic colors
  const metalColors = {
    1: { bg: 'from-yellow-400/20 to-amber-600/10', ring: 'ring-yellow-400/50', text: 'text-yellow-400' },
    2: { bg: 'from-slate-300/20 to-slate-500/10', ring: 'ring-slate-400/50', text: 'text-slate-300' },
    3: { bg: 'from-amber-600/20 to-amber-800/10', ring: 'ring-amber-600/50', text: 'text-amber-500' },
  };
  
  const colors = metalColors[rank];
  
  return (
    <Link
      to={`/tourhub/player/${player.player_id}`}
      className={cn(
        "relative flex flex-col items-center transition-transform hover:scale-105",
        size === 'lg' ? 'w-32' : 'w-24'
      )}
    >
      {/* Crown for champion */}
      {isChamp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute -top-6 z-10"
        >
          <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400/30" />
        </motion.div>
      )}
      
      {/* Avatar */}
      <div 
        className={cn(
          "relative rounded-2xl overflow-hidden ring-2 mb-3",
          colors.ring,
          size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'
        )}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br', colors.bg)} />
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={player.player?.full_name || ''}
            className="relative w-full h-full object-cover object-top"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-white/10">
            <span className={cn(
              "font-bold text-white/70",
              size === 'lg' ? 'text-2xl' : 'text-lg'
            )}>
              {getInitials(player.player?.full_name || '')}
            </span>
          </div>
        )}
      </div>
      
      {/* Rank Badge */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <RankBadge rank={rank} size={size === 'lg' ? 'lg' : 'md'} />
      </div>
      
      {/* Info */}
      <div className="text-center mt-4 w-full">
        <p className={cn(
          "font-semibold text-white truncate",
          size === 'lg' ? 'text-sm' : 'text-xs'
        )}>
          {player.player?.full_name?.split(' ').pop()}
        </p>
        <p className="text-[10px] text-white/50 truncate">
          {toTitleCase(player.player?.country)}
        </p>
        {!category.isWorldRank && player.value !== null && (
          <p className={cn('font-bold mt-1', colors.text, size === 'lg' ? 'text-lg' : 'text-sm')}>
            {category.formatShort(player.value)}
          </p>
        )}
      </div>
    </Link>
  );
}

// Leader row component
interface LeaderRowProps {
  player: {
    id: string;
    player_id: string;
    player?: {
      full_name: string;
      country?: string | null;
      photo_url?: string | null;
    };
    value: number | null;
  };
  rank: number;
  category: LeaderCategory;
}

function LeaderRow({ player, rank, category }: LeaderRowProps) {
  const displayValue = player.value !== null && player.value !== undefined
    ? category.formatShort(player.value)
    : '—';
  
  return (
    <Link to={`/tourhub/player/${player.player_id}`}>
      <GlassCard className="p-3 flex items-center gap-3 group hover:bg-white/10 transition-colors">
        {/* Rank */}
        <span className="w-8 text-center text-sm font-medium text-white/50 tabular-nums">
          {rank}
        </span>
        
        {/* Avatar */}
        <PlayerAvatar
          playerId={player.player_id}
          playerName={player.player?.full_name || ''}
          fallbackPhotoUrl={player.player?.photo_url}
          size="sm"
        />
        
        {/* Name + Country */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-th-accent transition-colors">
            {player.player?.full_name}
          </p>
          <p className="text-xs text-white/50 truncate">
            {toTitleCase(player.player?.country)}
          </p>
        </div>
        
        {/* Value */}
        <span className="text-sm font-semibold text-white tabular-nums">
          {displayValue}
        </span>
      </GlassCard>
    </Link>
  );
}
