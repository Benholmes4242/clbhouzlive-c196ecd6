/**
 * PlayersFeed - Top Players with intelligent tabs
 * Improved tab styling with underline + accent
 * Smooth crossfade animation when switching tabs
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

type SortOption = 'world_rank' | 'cuts' | 'events';

interface PlayersFeedProps {
  players: (TourPlayerStatistics & { raw_data?: any })[];
  maxEvents: number;
  maxCuts: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'world_rank', label: 'World Rank' },
  { value: 'cuts', label: 'Most Cuts' },
  { value: 'events', label: 'Most Events' },
];

function getNarrativeTag(stat: any, sortBy: SortOption): string {
  const rawStats = stat.raw_data?.statistics;
  
  if (sortBy === 'events') {
    if (rawStats?.top_10) return `${rawStats.top_10} Top 10s`;
    return '';
  }
  
  if (sortBy === 'cuts') {
    const cutRate = stat.cuts_made && stat.events_played 
      ? Math.round((stat.cuts_made / stat.events_played) * 100) 
      : null;
    if (cutRate) return `${cutRate}% cut rate`;
    return '';
  }
  
  if (sortBy === 'world_rank') {
    if (rawStats?.wins) return `${rawStats.wins} wins`;
    return '';
  }
  
  return '';
}

export function PlayersFeed({ players, maxEvents, maxCuts }: PlayersFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>('world_rank');

  const sortedPlayers = useMemo(() => {
    return [...players]
      .filter(s => s.player)
      .sort((a, b) => {
        switch (sortBy) {
          case 'events':
            return (b.events_played || 0) - (a.events_played || 0);
          case 'cuts':
            return (b.cuts_made || 0) - (a.cuts_made || 0);
          case 'world_rank': {
            const aRank = a.raw_data?.statistics?.world_rank || 9999;
            const bRank = b.raw_data?.statistics?.world_rank || 9999;
            return aRank - bRank;
          }
          default:
            return 0;
        }
      })
      .slice(0, 5);
  }, [players, sortBy]);

  if (!sortedPlayers.length) return null;

  return (
    <div className="space-y-6">
      {/* Header - matching Schedule page section headers */}
      <div className="flex items-center justify-between">
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ fontSize: '13px', letterSpacing: '0.08em' }}
        >
          Top Players
        </h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          All leaders <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Tab styling - segmented control matching Schedule page */}
      <div 
        className="flex items-stretch rounded-xl overflow-hidden"
        style={{ background: '#e2e8f0' }}
      >
        {sortOptions.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                "min-h-[44px]",
                isActive 
                  ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Player List with crossfade animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sortBy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {sortedPlayers.map((stat, index) => {
            const rawStats = stat.raw_data?.statistics;
            const worldRank = rawStats?.world_rank;
            const narrativeTag = getNarrativeTag(stat, sortBy);
            
            return (
              <Link
                key={stat.id}
                to={`/tourhub/player/${stat.player_id}`}
                className="flex items-center gap-3 py-3.5 group transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
              >
                {/* Player photo */}
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  {stat.player?.photo_url ? (
                    <img 
                      src={stat.player.photo_url} 
                      alt={stat.player.full_name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-sm font-bold text-muted-foreground/50">
                        {stat.player?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-[15px]">
                    {stat.player?.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {toTitleCase(stat.player?.country)}
                    </span>
                    {narrativeTag && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {narrativeTag}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Primary Stat with count-up animation feel */}
                <div className="text-right flex-shrink-0">
                  {sortBy === 'events' && (
                    <p className="text-lg font-bold text-foreground">{stat.events_played || 0}</p>
                  )}
                  {sortBy === 'cuts' && (
                    <p className="text-lg font-bold text-foreground">{stat.cuts_made || 0}</p>
                  )}
                  {sortBy === 'world_rank' && worldRank && (
                    <p className="text-lg font-bold text-foreground">#{worldRank}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
