/**
 * TopPlayersFeed - Story-led player list with narrative labels and mini progress bars
 */

import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

type SortOption = 'events' | 'cuts' | 'world_rank';

interface TopPlayersFeedProps {
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
    if (rawStats?.wins) return `${rawStats.wins} Wins`;
    return 'Season appearances leader';
  }
  
  if (sortBy === 'cuts') {
    const cutRate = stat.cuts_made && stat.events_played 
      ? Math.round((stat.cuts_made / stat.events_played) * 100) 
      : null;
    if (cutRate) return `${cutRate}% cut rate`;
    return 'Consistent starter';
  }
  
  if (sortBy === 'world_rank') {
    if (rawStats?.wins) return `${rawStats.wins} wins this season`;
    if (rawStats?.top_10) return `${rawStats.top_10} Top 10 finishes`;
    return 'Elite performer';
  }
  
  return '';
}

export function TopPlayersFeed({ players, maxEvents, maxCuts }: TopPlayersFeedProps) {
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
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">Top Players</h3>
        </div>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 transition-colors"
        >
          All leaders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sort Tabs - matching courses page style with orange underline */}
      <div className="flex mb-5 overflow-x-auto">
        {sortOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={cn(
              "relative text-sm px-3 py-2.5 font-medium whitespace-nowrap",
              "bg-transparent border-0 shadow-none rounded-none",
              "transition-colors duration-200 ease-out",
              // Orange underline using after pseudo-element
              "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
              "after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))]",
              "after:transition-all after:duration-200 after:ease-out",
              sortBy === opt.value
                ? 'text-foreground after:w-full after:opacity-[0.85]'
                : 'text-muted-foreground hover:text-foreground after:w-0 after:opacity-0'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Player List */}
      <div className="space-y-3">
        {sortedPlayers.map((stat, index) => {
          const rawStats = stat.raw_data?.statistics;
          const worldRank = rawStats?.world_rank;
          const narrativeTag = getNarrativeTag(stat, sortBy);
          
          // Calculate progress bar ratio
          const progressValue = sortBy === 'events' 
            ? (stat.events_played || 0) / (maxEvents || 1)
            : sortBy === 'cuts'
              ? (stat.cuts_made || 0) / (maxCuts || 1)
              : 0;
          
          // Rank badge intensity (top ranks get stronger halo)
          const rankIntensity = index < 3 ? (3 - index) * 0.15 : 0;
          
          return (
            <Link
              key={stat.id}
              to={`/tourhub/player/${stat.player_id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              {/* Avatar with halo - now the left-most element */}
              <div 
                className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  background: 'hsl(var(--muted))',
                  boxShadow: rankIntensity > 0 ? `0 0 8px hsl(var(--primary) / ${rankIntensity})` : 'none',
                }}
              >
                {(() => {
                  const headshot = getPlayerHeadshotUrl(stat.player?.full_name ?? '', stat.player?.tour_codes?.[0] ?? 'pga');
                  return (
                    <img 
                      src={headshot}
                      alt={stat.player?.full_name ?? ''}
                      className="w-10 h-10 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                    />
                  );
                })()}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors text-sm truncate">
                  {stat.player?.full_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{toTitleCase(stat.player?.country)}</span>
                  {narrativeTag && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">{narrativeTag}</span>
                    </>
                  )}
                </div>
                
                {/* Mini progress bar */}
                {sortBy !== 'world_rank' && progressValue > 0 && (
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/60 rounded-full transition-all duration-500"
                      style={{ width: `${progressValue * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              {/* Primary Stat - simplified without redundant labels */}
              <div className="text-right shrink-0">
                {sortBy === 'events' && (
                  <p className="font-semibold text-foreground text-sm">{stat.events_played || 0}</p>
                )}
                {sortBy === 'cuts' && (
                  <p className="font-semibold text-foreground text-sm">{stat.cuts_made || 0}</p>
                )}
                {sortBy === 'world_rank' && worldRank && (
                  <p className="font-semibold text-foreground text-sm">#{worldRank}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
