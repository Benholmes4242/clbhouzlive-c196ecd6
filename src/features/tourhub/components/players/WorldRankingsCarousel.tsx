/**
 * WorldRankingsCarousel - Premium prestige-styled top world rankings
 * 
 * Features:
 * - Top 3 with medal tints (gold, silver, bronze)
 * - #1 slightly larger than #2/#3
 * - Rank as subtle background typography
 * - Apple Sports prestige feel
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

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function WorldRankCard({ player, worldRank, className }: WorldRankCardProps) {
  const formattedCountry = player.country ? toTitleCase(player.country) : '';
  
  // Medal tints for top 3
  const medalConfig = {
    1: { bg: 'bg-gradient-to-b from-amber-50 to-amber-100/50', border: 'border-amber-200/60', glow: 'shadow-amber-200/30' },
    2: { bg: 'bg-gradient-to-b from-slate-50 to-slate-100/50', border: 'border-slate-200/60', glow: 'shadow-slate-200/30' },
    3: { bg: 'bg-gradient-to-b from-orange-50 to-orange-100/40', border: 'border-orange-200/50', glow: 'shadow-orange-200/20' },
  };
  
  const medal = medalConfig[worldRank as keyof typeof medalConfig];
  const isTop3 = worldRank <= 3;
  const isNumber1 = worldRank === 1;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "group flex-shrink-0 snap-start relative overflow-hidden",
        "flex flex-col items-center gap-2 rounded-2xl",
        "border transition-all duration-200",
        "hover:shadow-lg active:scale-[0.98]",
        // Size varies by rank
        isNumber1 ? "w-[130px] p-4" : "w-[115px] p-3",
        // Medal styling for top 3
        isTop3 && medal 
          ? cn(medal.bg, medal.border, `shadow-md ${medal.glow}`)
          : "bg-card border-border/50 shadow-sm hover:shadow-md hover:border-border",
        className
      )}
    >
      {/* Background rank number (low opacity) */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none select-none",
        "font-bold text-[80px] leading-none",
        isTop3 ? "text-black/[0.03]" : "text-muted-foreground/[0.03]"
      )}>
        {worldRank}
      </div>

      {/* Avatar */}
      <div className="relative z-10">
        <PlayerAvatar
          playerId={player.id}
          playerName={player.full_name}
          fallbackPhotoUrl={player.photo_url}
          size={isNumber1 ? "lg" : "md"}
        />
      </div>

      {/* Full Name */}
      <p className={cn(
        "font-semibold text-center leading-tight line-clamp-2 w-full min-h-[2rem] z-10",
        isNumber1 ? "text-sm" : "text-xs"
      )}>
        {player.full_name}
      </p>

      {/* Country */}
      <p className="text-[11px] text-muted-foreground text-center leading-tight line-clamp-1 w-full z-10">
        {formattedCountry}
      </p>

      {/* World Rank Badge - smaller and cleaner */}
      <span className={cn(
        "text-[9px] font-medium px-2 py-0.5 rounded-full z-10",
        isNumber1 
          ? "bg-amber-500/90 text-white" 
          : isTop3 
            ? "bg-black/5 text-foreground/70" 
            : "bg-muted text-muted-foreground"
      )}>
        #{worldRank}
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
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          Full Rankings
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
