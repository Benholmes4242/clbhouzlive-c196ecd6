/**
 * IdentityCard - Premium player row with college deep-link
 * 
 * Layout: [Avatar + Rank Badge] | [Name + Country] | [College Logo OR Pro Year]
 * - Tap on row = player profile
 * - Tap on college logo = college alumni page (deep-link)
 * - Subtle tap scale animation
 */

import { Link, useNavigate } from 'react-router-dom';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { PlayerAvatar } from '../PlayerAvatar';

interface IdentityCardProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics & { worldRank?: number | null };
  college?: CollegeMedia | null;
  statDisplay?: 'rank' | 'events' | 'wins';
  className?: string;
}

/**
 * Convert country to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function IdentityCard({ player, stats, college, statDisplay = 'rank', className }: IdentityCardProps) {
  const navigate = useNavigate();
  
  // Format country in Title Case
  const formattedCountry = player.country ? toTitleCase(player.country) : null;

  // Get world rank
  const worldRank = stats?.worldRank ?? stats?.world_rank;
  const hasValidRank = typeof worldRank === 'number' && worldRank >= 1;

  // College deep-link handler
  const handleCollegeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (college?.normalized_name) {
      navigate(`/tourhub/college-golf/${college.normalized_name}`);
    }
  };

  // Get display text for college or pro year
  const collegeShortName = college?.short_name || college?.college_name || player.college;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        className={cn(
          "flex items-center justify-between py-3.5 px-3 transition-all cursor-pointer",
          "hover:bg-muted/40 rounded-xl -mx-3",
          "active:bg-muted/60",
          "border-b border-border/20 last:border-b-0",
          className
        )}
      >
        {/* Left: Avatar + Rank Badge + Player Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar with Rank Badge below */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <PlayerAvatar
              playerId={player.id}
              playerName={player.full_name}
              
              size="md"
            />
            {/* Rank Badge - tiered colors with subtle glow */}
            {hasValidRank && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full leading-none",
                worldRank <= 10 
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30" 
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
            <h3 className="font-semibold text-[15px] text-foreground leading-tight truncate">
              {player.full_name}
            </h3>
            {formattedCountry && (
              <p className="text-sm text-muted-foreground/80 truncate mt-0.5">
                {formattedCountry}
              </p>
            )}
          </div>
        </div>

        {/* Right: College Feature with Deep Link */}
        <div className="flex flex-col items-center shrink-0 min-w-[64px] ml-2">
          {getCollegeLogoUrl(college?.college_name || player.college) ? (
            <button
              onClick={handleCollegeClick}
              className={cn(
                "group/college flex flex-col items-center",
                "transition-transform hover:scale-105 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] rounded-lg p-1.5 -m-1.5"
              )}
              aria-label={`View ${college?.college_name || player.college} alumni`}
            >
              {/* "College" label above logo */}
              <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1">
                College
              </span>
              <div className={cn(
                "w-11 h-11 rounded-xl overflow-hidden",
                "bg-background border border-border/50",
                "flex items-center justify-center",
                "shadow-sm",
                "group-hover/college:border-primary/40 group-hover/college:shadow-md",
                "group-active/college:scale-95",
                "transition-all duration-200"
              )}>
                <img 
                  src={getCollegeLogoUrl(college?.college_name || player.college)!} 
                  alt={college?.college_name || player.college || ''}
                  className="w-9 h-9 object-contain"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 text-center max-w-[72px] truncate leading-tight group-hover/college:text-primary transition-colors">
                {collegeShortName}
              </span>
            </button>
          ) : player.college ? (
            <span className="text-xs text-muted-foreground text-center max-w-[72px] line-clamp-2 leading-tight">
              {player.college}
            </span>
          ) : player.turned_pro ? (
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-muted-foreground/70">
                Pro
              </span>
              <span className="text-sm font-semibold text-foreground/80">
                {player.turned_pro}
              </span>
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
