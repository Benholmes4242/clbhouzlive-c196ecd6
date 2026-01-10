/**
 * PlayerRow - Editorial flat row for player list
 * Inspired by Apple Music / PGA leaderboard rows
 * 
 * Layout: Avatar | Name + Country + Secondary | Stat
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerRowProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics;
  statDisplay?: 'rank' | 'events' | 'wins';
  className?: string;
}

export function PlayerRow({ player, stats, statDisplay = 'rank', className }: PlayerRowProps) {
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Determine which secondary info to show (college OR turned pro, not both)
  const secondaryInfo = player.college 
    ? player.college 
    : player.turned_pro 
      ? `Pro since ${player.turned_pro}` 
      : null;

  // Determine stat to display on the right
  const getStatValue = () => {
    if (!stats) return null;
    
    switch (statDisplay) {
      case 'rank':
        return stats.fedex_rank ? `#${stats.fedex_rank}` : null;
      case 'events':
        return stats.events_played ? `${stats.events_played} events` : null;
      case 'wins':
        return stats.wins ? `${stats.wins} win${stats.wins > 1 ? 's' : ''}` : null;
      default:
        return stats.fedex_rank ? `#${stats.fedex_rank}` : null;
    }
  };

  const statValue = getStatValue();

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center gap-4 py-3 px-1 transition-all duration-200",
        "hover:bg-muted/30 rounded-lg -mx-1",
        "active:bg-muted/50",
        className
      )}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {player.photo_url ? (
          <img 
            src={player.photo_url} 
            alt={player.full_name}
            className="w-11 h-11 object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{initials}</span>
        )}
      </div>

      {/* Name + Country + Secondary */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-[15px] leading-tight truncate">
          {player.full_name}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {player.country && (
            <span className="text-sm text-muted-foreground truncate">
              {player.country}
            </span>
          )}
          {player.country && secondaryInfo && (
            <span className="text-muted-foreground/40">·</span>
          )}
          {secondaryInfo && (
            <span className="text-sm text-muted-foreground/70 truncate">
              {secondaryInfo}
            </span>
          )}
        </div>
      </div>

      {/* Stat */}
      {statValue && (
        <div className="shrink-0 text-right">
          <span className="text-sm font-medium text-muted-foreground">
            {statValue}
          </span>
        </div>
      )}
    </Link>
  );
}
