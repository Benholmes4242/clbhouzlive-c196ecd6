import { Link } from 'react-router-dom';
import { ArrowRight, User, TrendingUp } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type SortOption = 'events' | 'cuts' | 'world_rank';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'events', label: 'Most Events' },
  { value: 'cuts', label: 'Most Cuts' },
  { value: 'world_rank', label: 'World Rank' },
];

interface PlayerStatWithRawData {
  id: string;
  player_id: string;
  events_played: number | null;
  cuts_made: number | null;
  player?: {
    id: string;
    full_name: string;
    country: string | null;
    photo_url: string | null;
  };
  raw_data?: {
    statistics?: {
      world_rank?: number;
      top_10?: number;
      top_25?: number;
      wins?: number;
      earnings?: number;
    };
  };
}

export function TopPlayersPreview() {
  const [sortBy, setSortBy] = useState<SortOption>('events');
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);

  const sortedPlayers = useMemo(() => {
    if (!playerStats) return [];
    
    const stats = playerStats as PlayerStatWithRawData[];
    
    return [...stats]
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
  }, [playerStats, sortBy]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!sortedPlayers.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Top Players</h3>
        </div>
        <Link 
          to="/tourhub?tab=leaderboards"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          All leaders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Sort Tabs - matching courses page tabs (orange underline) */}
      <div className="grid w-full grid-cols-3 mb-4">
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

      {/* Player List */}
      <div className="space-y-2">
        {sortedPlayers.map((stat, index) => {
          const rawStats = stat.raw_data?.statistics;
          const worldRank = rawStats?.world_rank;
          
          return (
            <Link
              key={stat.id}
              to={`/tourhub/player/${stat.player_id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {stat.player?.photo_url ? (
                    <img 
                      src={stat.player.photo_url} 
                      alt={stat.player.full_name}
                      className="w-9 h-9 object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                    {stat.player?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.player?.country}</p>
                </div>
              </div>
              
              <div className="text-right">
                {sortBy === 'events' && (
                  <p className="font-medium text-foreground text-sm">{stat.events_played || 0} events</p>
                )}
                {sortBy === 'cuts' && (
                  <p className="font-medium text-foreground text-sm">{stat.cuts_made || 0} cuts</p>
                )}
                {sortBy === 'world_rank' && worldRank && (
                  <p className="font-medium text-foreground text-sm">#{worldRank}</p>
                )}
                {rawStats?.top_10 && sortBy !== 'world_rank' && (
                  <p className="text-xs text-muted-foreground">{rawStats.top_10} top 10s</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
