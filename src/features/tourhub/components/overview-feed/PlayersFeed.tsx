/**
 * PlayersFeed - Flat rows on page background (no cards)
 * Image-first with subtle dividers
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

type SortOption = 'events' | 'cuts' | 'world_rank';

interface PlayersFeedProps {
  players: (TourPlayerStatistics & { raw_data?: any })[];
  maxEvents: number;
  maxCuts: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'events', label: 'Most Events' },
  { value: 'cuts', label: 'Most Cuts' },
  { value: 'world_rank', label: 'World Rank' },
];

function getNarrativeTag(stat: any, sortBy: SortOption): string {
  const rawStats = stat.raw_data?.statistics;
  
  if (sortBy === 'events') {
    if (rawStats?.top_10) return `${rawStats.top_10} Top 10s`;
    return 'Most appearances';
  }
  
  if (sortBy === 'cuts') {
    const cutRate = stat.cuts_made && stat.events_played 
      ? Math.round((stat.cuts_made / stat.events_played) * 100) 
      : null;
    if (cutRate) return `${cutRate}% cut rate`;
    return 'Cuts leader';
  }
  
  if (sortBy === 'world_rank') {
    if (rawStats?.wins) return `${rawStats.wins} wins`;
    return 'Top ranked';
  }
  
  return '';
}

export function PlayersFeed({ players, maxEvents, maxCuts }: PlayersFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>('events');

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Top Players</h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 transition-colors"
        >
          All leaders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sort Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sortOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all",
              sortBy === opt.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Player List - Flat rows on page background */}
      <div>
        {sortedPlayers.map((stat, index) => {
          const rawStats = stat.raw_data?.statistics;
          const worldRank = rawStats?.world_rank;
          const narrativeTag = getNarrativeTag(stat, sortBy);
          
          return (
            <Link
              key={stat.id}
              to={`/tourhub/player/${stat.player_id}`}
              className="flex items-center gap-3 py-3 group transition-colors"
            >
              {/* Player photo - circular - NOW LEFT-MOST ELEMENT */}
              <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                {stat.player?.photo_url ? (
                  <img 
                    src={stat.player.photo_url} 
                    alt={stat.player.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <span className="text-sm font-bold text-muted-foreground/50">
                      {stat.player?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Player Info - center */}
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
              
              {/* Primary Stat - right aligned - NO REDUNDANT LABELS */}
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
      </div>
    </div>
  );
}
