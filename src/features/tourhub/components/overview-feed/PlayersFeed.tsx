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

type SortOption = 'world_rank' | 'cuts' | 'events';

interface PlayersFeedProps {
  players: (TourPlayerStatistics & { raw_data?: any })[];
  maxEvents: number;
  maxCuts: number;
}

// Reordered: World Rank first (default), then Cuts, then Events
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
    // No redundant "Top ranked" - they're already in the World Rank tab
    return '';
  }
  
  return '';
}

export function PlayersFeed({ players, maxEvents, maxCuts }: PlayersFeedProps) {
  // Default to World Rank (first/premium tab)
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
      {/* Header - standardized */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground tracking-wide">
          Top Players
        </h3>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          All leaders <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Sort Tabs - matching courses page tabs (orange underline) */}
      <div className="grid w-full grid-cols-3">
        {sortOptions.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "w-full inline-flex items-center justify-center",
                "relative text-sm px-3 py-2.5 font-medium whitespace-nowrap",
                "bg-transparent border-0 shadow-none rounded-none",
                "transition-colors duration-200 ease-out",
                // Orange underline using after pseudo-element
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))]",
                "after:transition-all after:duration-200 after:ease-out",
                isActive
                  ? "text-foreground after:w-full after:opacity-[0.85]"
                  : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
              )}
            >
              {opt.label}
            </button>
          );
        })}
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
              className="flex items-center gap-3 py-3 group transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
            >
              {/* Player photo - circular - NOW LEFT-MOST ELEMENT */}
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
