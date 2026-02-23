/**
 * WorldRankingsCarousel - Top 5 world-ranked players carousel
 * Always visible on ALL tabs in the Players page
 * Shows full name on two lines, full country, player photos
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer } from '../../hooks/useTourHubData';
import { PlayerAvatar } from '../PlayerAvatar';

interface WorldRankCardProps {
  player: TourPlayer;
  worldRank: number;
  className?: string;
}

/**
 * Convert country to Title Case (handles "UNITED STATES" -> "United States")
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function WorldRankCard({ player, worldRank, className }: WorldRankCardProps) {
  // Format country - full name in Title Case
  const formattedCountry = player.country ? toTitleCase(player.country) : '';

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "group flex-shrink-0 w-[120px] snap-start",
        "flex flex-col items-center gap-2 p-3 rounded-xl",
        "bg-card border border-border/50 shadow-sm",
        "hover:shadow-md hover:border-border transition-all",
        className
      )}
    >
      {/* Avatar with photo */}
      <div className="relative">
        <PlayerAvatar
          playerId={player.id}
          playerName={player.full_name}
          
          size="lg"
        />
        {/* Hover indicator */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Full Name - two lines allowed */}
      <p className="font-medium text-xs text-center leading-tight line-clamp-2 w-full min-h-[2rem]">
        {player.full_name}
      </p>

      {/* Full Country */}
      <p className="text-[11px] text-muted-foreground text-center leading-tight line-clamp-2 w-full">
        {formattedCountry}
      </p>

      {/* World Rank Badge */}
      <span className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
        worldRank === 1 ? "bg-amber-500 text-white" :
        worldRank <= 5 ? "bg-amber-100 text-amber-700" :
        "bg-zinc-100 text-zinc-600"
      )}>
        World #{worldRank}
      </span>
    </Link>
  );
}

interface WorldRankingsCarouselProps {
  worldRankedPlayers: Array<{
    playerId: string;
    playerName: string;
    worldRank: number;
    country?: string | null;
    photoUrl?: string | null;
  }>;
  players: TourPlayer[];
}

export function WorldRankingsCarousel({ worldRankedPlayers, players }: WorldRankingsCarouselProps) {
  // Get top 5 world-ranked players with their full player data
  const top5 = useMemo(() => {
    const playerMap = new Map(players.map(p => [p.id, p]));
    
    return worldRankedPlayers
      .slice(0, 5)
      .map(wp => ({
        player: playerMap.get(wp.playerId),
        worldRank: wp.worldRank,
      }))
      .filter((item): item is { player: TourPlayer; worldRank: number } => 
        item.player !== undefined
      );
  }, [worldRankedPlayers, players]);

  if (top5.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          World Rankings
        </h3>
        <Link 
          to="/tourhub?tab=players&filter=top-ranked"
          className="text-xs text-primary hover:underline flex items-center gap-0.5 focus:outline-none focus-visible:outline-none"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {top5.map(({ player, worldRank }) => (
            <WorldRankCard
              key={player.id}
              player={player}
              worldRank={worldRank}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
