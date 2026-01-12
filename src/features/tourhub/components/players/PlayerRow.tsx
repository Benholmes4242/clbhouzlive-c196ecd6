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
  const getStatValue = (): { value: string; style: 'gold' | 'bold' | 'muted' } | null => {
    if (!stats) return null;
    
    switch (statDisplay) {
      case 'rank':
        // Use worldRank (from PlayersTab statsMap) or fall back to world_rank from stats
        // This is the canonical source (OWGR), NOT fedex_rank
        const worldRank = stats.worldRank ?? stats.world_rank;
        if (!worldRank || worldRank < 1) return null;
        
        // Style based on rank tier
        if (worldRank <= 10) return { value: `#${worldRank}`, style: 'gold' };
        if (worldRank <= 50) return { value: `#${worldRank}`, style: 'bold' };
        return { value: `#${worldRank}`, style: 'muted' };
      case 'events':
        return stats.events_played ? { value: `${stats.events_played} events`, style: 'muted' } : null;
      case 'wins':
        return stats.wins ? { value: `${stats.wins} win${stats.wins > 1 ? 's' : ''}`, style: 'bold' } : null;
      default:
        const defaultRank = stats.worldRank ?? stats.world_rank;
        if (!defaultRank || defaultRank < 1) return null;
        if (defaultRank <= 10) return { value: `#${defaultRank}`, style: 'gold' };
        if (defaultRank <= 50) return { value: `#${defaultRank}`, style: 'bold' };
        return { value: `#${defaultRank}`, style: 'muted' };
    }
  };

  const statResult = getStatValue();

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center gap-4 py-3.5 px-1 transition-all duration-200",
        "hover:bg-muted/40 rounded-lg -mx-1",
        "active:bg-muted/60",
        "border-b border-border/20 last:border-b-0",
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

      {/* Stat with tiered styling */}
      {statResult && (
        <div className="shrink-0 text-right">
          <span className={cn(
            "text-sm",
            statResult.style === 'gold' && "font-bold text-amber-600",
            statResult.style === 'bold' && "font-semibold text-foreground",
            statResult.style === 'muted' && "font-medium text-muted-foreground"
          )}>
            {statResult.value}
          </span>
        </div>
      )}
    </Link>
  );
}
