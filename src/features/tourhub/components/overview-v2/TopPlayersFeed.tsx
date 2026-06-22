/**
 * TopPlayersFeed - Story-led player list with narrative labels and mini progress bars
 */

import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
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

      {/* Sort Tabs - pill style */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {sortOptions.map(opt => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold shrink-0",
                isActive
                  ? "text-white"
                  : "text-muted-foreground bg-muted"
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
            >
              {opt.label}
            </button>
          );
        })}
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
              {/* Avatar — canonical multi-folder walk + initials fallback */}
              <div
                className="relative flex items-center justify-center shrink-0"
                style={{
                  boxShadow: rankIntensity > 0 ? `0 0 8px hsl(var(--primary) / ${rankIntensity})` : 'none',
                  borderRadius: '34%',
                }}
              >
                <SquircleAvatar
                  size={40}
                  srcCandidates={resolvePlayerAvatarCandidates({
                    name: stat.player?.full_name ?? '',
                    photoUrl: (stat.player as any)?.photo_url ?? null,
                    tourSlug: stat.player?.tour_codes?.[0] ?? 'pga',
                  })}
                  alt={stat.player?.full_name ?? ''}
                  userId={stat.player?.id ?? stat.player?.full_name ?? ''}
                  hideRing
                />
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
