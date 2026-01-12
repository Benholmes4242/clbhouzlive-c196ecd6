/**
 * WorldRankingsCarousel - Top 5 world-ranked players carousel
 * Always visible on ALL tabs in the Players page
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer } from '../../hooks/useTourHubData';
import type { WorldRankedPlayer } from '../../hooks/useWorldRankings';
import { usePlayerHeadshots } from '../../hooks/usePlayerMedia';
import { PlayerAvatar } from '../PlayerAvatar';

interface WorldRankCardProps {
  player: TourPlayer;
  worldRank: number;
  headshotUrl?: string | null;
  className?: string;
}

function WorldRankCard({ player, worldRank, headshotUrl, className }: WorldRankCardProps) {
  // Format country - get 3-letter code or abbreviated
  const countryCode = player.country?.toUpperCase().slice(0, 3) || '';

  // Get initials for fallback
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Photo URL priority: headshot from player_media > sr_players.photo_url
  const photoUrl = headshotUrl || player.photo_url;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "group flex-shrink-0 w-[100px] snap-start",
        "flex flex-col items-center gap-1.5 p-3 rounded-xl",
        "bg-card border border-border/50 shadow-sm",
        "hover:shadow-md hover:border-border transition-all",
        className
      )}
    >
      {/* Avatar - render directly without extra hook calls */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={player.full_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-medium text-lg text-muted-foreground">{initials}</span>
          )}
        </div>
        {/* Hover indicator */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Name - truncated to last name */}
      <p className="font-medium text-xs text-center leading-tight line-clamp-1 w-full">
        {player.full_name.split(' ').pop()}
      </p>

      {/* Country code */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {countryCode}
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
  worldRankedPlayers: WorldRankedPlayer[];
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
        worldRank: wp.worldRank!,
        photoUrl: wp.photoUrl, // from sr_players via useWorldRankings
      }))
      .filter((item): item is { player: TourPlayer; worldRank: number; photoUrl: string | null } => 
        item.player !== undefined && item.worldRank !== null
      );
  }, [worldRankedPlayers, players]);

  // Batch fetch headshots for all top 5 players
  const playerIds = useMemo(() => top5.map(p => p.player.id), [top5]);
  const { data: headshotMap } = usePlayerHeadshots(playerIds);

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
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {top5.map(({ player, worldRank, photoUrl }) => (
            <WorldRankCard
              key={player.id}
              player={player}
              worldRank={worldRank}
              headshotUrl={headshotMap?.get(player.id) || photoUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
