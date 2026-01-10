/**
 * PlayerRow - Editorial flat row for player list
 * Inspired by Apple Music / PGA leaderboard rows
 * 
 * Layout: Avatar | Name + Country (line 2) + Context with college logo (line 3) | Stat
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { PlayerAvatar } from '../PlayerAvatar';
import { CollegeDisplay } from '../CollegeLogo';

interface PlayerRowProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics & { worldRank?: number | null };
  /** Pre-resolved college media for efficient rendering */
  college?: CollegeMedia | null;
  statDisplay?: 'rank' | 'events' | 'wins';
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

export function PlayerRow({ player, stats, college, statDisplay = 'rank', className }: PlayerRowProps) {
  // Format country in Title Case
  const formattedCountry = player.country ? toTitleCase(player.country) : null;

  // Determine stat to display on the right
  const getStatValue = () => {
    if (!stats) return null;
    
    switch (statDisplay) {
      case 'rank':
        // Use worldRank (from PlayersTab statsMap) or fall back to world_rank from stats
        // This is the canonical source (OWGR), NOT fedex_rank
        const worldRank = stats.worldRank ?? stats.world_rank;
        return worldRank && worldRank >= 1 ? `#${worldRank}` : null;
      case 'events':
        return stats.events_played ? `${stats.events_played} events` : null;
      case 'wins':
        return stats.wins ? `${stats.wins} win${stats.wins > 1 ? 's' : ''}` : null;
      default:
        const defaultRank = stats.worldRank ?? stats.world_rank;
        return defaultRank && defaultRank >= 1 ? `#${defaultRank}` : null;
    }
  };

  const statValue = getStatValue();

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center gap-4 py-3.5 px-1 transition-all duration-200",
        "hover:bg-muted/30 rounded-lg -mx-1",
        "active:bg-muted/50",
        className
      )}
    >
      {/* Avatar - now uses PlayerAvatar with headshot lookup */}
      <PlayerAvatar
        playerId={player.id}
        playerName={player.full_name}
        fallbackPhotoUrl={player.photo_url}
        size="md"
      />

      {/* Name + Country (line 2) + Context (line 3) */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Line 1: Name */}
        <h3 className="font-semibold text-foreground text-[15px] leading-tight truncate">
          {player.full_name}
        </h3>
        
        {/* Line 2: Country (Title Case) */}
        {formattedCountry && (
          <p className="text-sm text-muted-foreground truncate">
            {formattedCountry}
          </p>
        )}
        
        {/* Line 3: College with logo OR Turned Pro */}
        {player.college ? (
          <p className="text-[13px] text-muted-foreground/60 flex items-center gap-1 truncate">
            <span className="shrink-0">College:</span>
            <CollegeDisplay 
              collegeName={player.college} 
              college={college || null}
              size="xs"
              className="text-muted-foreground/60"
            />
          </p>
        ) : player.turned_pro ? (
          <p className="text-[13px] text-muted-foreground/60 truncate">
            Turned Pro: {player.turned_pro}
          </p>
        ) : null}
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
