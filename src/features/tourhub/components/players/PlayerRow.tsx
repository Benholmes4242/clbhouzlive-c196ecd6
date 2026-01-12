/**
 * PlayerRow - College Gamification Focus
 * 
 * Layout: [Avatar + Rank Badge] | [Name + Country] | [College Logo/Info]
 * - Rank badge BELOW avatar (left side)
 * - College logo prominent on RIGHT side (40px)
 * - Clickable entire row
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface PlayerRowProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics & { worldRank?: number | null };
  /** Pre-resolved college media for efficient rendering */
  college?: CollegeMedia | null;
  /** Pre-fetched headshot URL from batch query */
  headshotUrl?: string | null;
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

export function PlayerRow({ player, stats, college, headshotUrl, statDisplay = 'rank', className }: PlayerRowProps) {
  // Format country in Title Case
  const formattedCountry = player.country ? toTitleCase(player.country) : null;

  // Get world rank
  const worldRank = stats?.worldRank ?? stats?.world_rank;
  const hasValidRank = typeof worldRank === 'number' && worldRank >= 1;

  // Get short college name
  const collegeShortName = college?.short_name || college?.college_name || player.college;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center justify-between py-3 px-2 transition-colors cursor-pointer",
        "hover:bg-muted/50 rounded-lg -mx-2",
        "active:bg-muted/70",
        "border-b border-border/30 last:border-b-0",
        className
      )}
    >
      {/* Left: Avatar + Rank Badge + Player Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar with Rank Badge below */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {/* Avatar - use pre-fetched headshot or fallback */}
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {(headshotUrl || player.photo_url) ? (
              <img 
                src={headshotUrl || player.photo_url || ''} 
                alt={player.full_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="font-medium text-sm text-muted-foreground">
                {player.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            )}
          </div>
          {/* Rank Badge - tiered colors */}
          {hasValidRank && (
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
              worldRank <= 10 
                ? "bg-amber-500 text-white" 
                : worldRank <= 50 
                  ? "bg-zinc-800 text-white" 
                  : "bg-zinc-200 text-zinc-600"
            )}>
              #{worldRank}
            </span>
          )}
        </div>

        {/* Player Info: Name + Country */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[15px] text-foreground leading-tight truncate">
            {player.full_name}
          </h3>
          {formattedCountry && (
            <p className="text-sm text-muted-foreground truncate">
              {formattedCountry}
            </p>
          )}
        </div>
      </div>

      {/* Right: College Feature - THE STAR */}
      <div className="flex flex-col items-center shrink-0 min-w-[60px] ml-2">
        {college?.logo_url ? (
          <>
            <img 
              src={college.logo_url} 
              alt={college.college_name}
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
            <span className="text-[10px] text-muted-foreground mt-1 text-center max-w-[70px] truncate leading-tight">
              {collegeShortName}
            </span>
          </>
        ) : player.college ? (
          <span className="text-xs text-muted-foreground text-center max-w-[70px] line-clamp-2">
            {player.college}
          </span>
        ) : player.turned_pro ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Pro {player.turned_pro}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
