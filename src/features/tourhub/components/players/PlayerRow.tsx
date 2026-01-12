/**
 * PlayerRow - College Gamification & Premium Design
 * 
 * Features:
 * - Glass pill rank badge overlapping avatar
 * - College "crest tile" with frosted background
 * - Tap feedback with micro-interaction
 * - Consistent right column (college or "Pro YYYY")
 */

import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { PlayerAvatar } from '../PlayerAvatar';

interface PlayerRowProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics & { worldRank?: number | null };
  college?: CollegeMedia | null;
  statDisplay?: 'rank' | 'events' | 'wins';
  className?: string;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function PlayerRow({ player, stats, college, statDisplay = 'rank', className }: PlayerRowProps) {
  const formattedCountry = player.country ? toTitleCase(player.country) : null;
  const worldRank = stats?.worldRank ?? stats?.world_rank;
  const hasValidRank = typeof worldRank === 'number' && worldRank >= 1;
  const collegeShortName = college?.short_name || college?.college_name || player.college;
  const hasCollege = college?.logo_url || player.college;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center justify-between py-3.5 px-3 transition-all duration-150 cursor-pointer",
        "hover:bg-muted/40 rounded-xl -mx-3",
        // Tap feedback - micro interaction
        "active:scale-[0.98] active:bg-muted/60",
        // Soft divider
        "border-b border-border/20 last:border-b-0",
        className
      )}
    >
      {/* Left: Avatar with rank badge overlay + Player Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar with glass rank badge */}
        <div className="relative shrink-0">
          <PlayerAvatar
            playerId={player.id}
            playerName={player.full_name}
            fallbackPhotoUrl={player.photo_url}
            size="md"
          />
          {/* Glass pill rank badge - bottom left overlap */}
          {hasValidRank && (
            <span className={cn(
              "absolute -bottom-1 -left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
              "backdrop-blur-md border shadow-sm",
              worldRank <= 10 
                ? "bg-amber-500/90 text-white border-amber-400/50" 
                : worldRank <= 50 
                  ? "bg-white/90 text-zinc-800 border-zinc-200/80" 
                  : "bg-white/80 text-zinc-500 border-zinc-200/60"
            )}>
              #{worldRank}
            </span>
          )}
        </div>

        {/* Player Info: Name + Country + College indicator */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-[15px] text-foreground leading-tight truncate">
              {player.full_name}
            </h3>
            {/* Subtle college indicator */}
            {hasCollege && (
              <GraduationCap className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            )}
          </div>
          {formattedCountry && (
            <p className="text-sm text-muted-foreground/80 truncate">
              {formattedCountry}
            </p>
          )}
        </div>
      </div>

      {/* Right: College Crest Tile - THE GAMIFICATION HOOK */}
      <div className="flex flex-col items-center shrink-0 min-w-[70px] ml-3">
        {college?.logo_url ? (
          /* Crest Tile - signature UI element */
          <div className={cn(
            "flex flex-col items-center gap-1",
          )}>
            {/* Frosted glass crest tile */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-b from-white/80 to-white/60",
              "backdrop-blur-sm border border-white/60",
              "shadow-sm",
              // Tap brightens
              "group-active:bg-white/90"
            )}>
              <img 
                src={college.logo_url} 
                alt={college.college_name}
                className="w-9 h-9 object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] text-muted-foreground/70 text-center max-w-[70px] truncate leading-tight">
              {collegeShortName}
            </span>
          </div>
        ) : player.college ? (
          /* College name only (no logo available) */
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-muted/40 border border-border/30"
            )}>
              <GraduationCap className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <span className="text-[10px] text-muted-foreground/60 text-center max-w-[70px] line-clamp-2 leading-tight">
              {player.college}
            </span>
          </div>
        ) : player.turned_pro ? (
          /* Pro YYYY - muted, consistent layout */
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-muted/20 border border-border/20"
            )}>
              <span className="text-xs font-medium text-muted-foreground/40">PRO</span>
            </div>
            <span className="text-[10px] text-muted-foreground/50">
              {player.turned_pro}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
