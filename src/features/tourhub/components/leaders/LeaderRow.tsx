/**
 * LeaderRow - Premium leaderboard row with tap states and college badges
 * Feels competitive and tappable, not like a contact list
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { CollegeCrestTile } from '../college';

interface LeaderRowProps {
  rank: number;
  name: string;
  country: string;
  countryCode?: string;
  avatarUrl?: string | null;
  statValue: string | number;
  statUnit?: string;
  collegeName?: string | null;
  collegeLogoUrl?: string | null;
  onClick?: () => void;
  className?: string;
}

export const LeaderRow: React.FC<LeaderRowProps> = ({
  rank,
  name,
  country,
  avatarUrl,
  statValue,
  statUnit,
  collegeName,
  collegeLogoUrl,
  onClick,
  className,
}) => {
  const isTop10 = rank <= 10;
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "relative w-full flex items-center gap-3 px-4 py-3 rounded-sq-md",
        "bg-white/70 dark:bg-white/5",
        "ring-1 ring-slate-200/60 dark:ring-white/8",
        // Hover & press states
        onClick && [
          "hover:bg-white dark:hover:bg-white/8",
          "active:scale-[0.995] active:bg-slate-50 dark:active:bg-white/10",
        ],
        "transition-all duration-motion-fast ease-out",
        className
      )}
    >
      {/* Top 10 accent bar */}
      {isTop10 && (
        <div className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full",
          isTop3 ? "bg-brand-orange" : "bg-brand-orange/60"
        )} />
      )}

      {/* Rank */}
      <div className={cn(
        "w-8 text-center font-semibold tabular-nums",
        isTop3 ? "text-brand-orange text-base" : "text-muted-foreground text-sm"
      )}>
        {rank}
      </div>

      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0",
        isTop3 && "ring-2 ring-brand-orange/30"
      )}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + Country */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{country}</p>
      </div>

      {/* Stat value */}
      <div className="text-right">
        <p className={cn(
          "font-semibold tabular-nums",
          isTop3 ? "text-base text-foreground" : "text-sm text-foreground"
        )}>
          {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
        </p>
        {statUnit && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{statUnit}</p>
        )}
      </div>

      {/* College crest badge */}
      {collegeName && collegeLogoUrl && (
        <div className="flex-shrink-0 ml-2">
          <div className="flex flex-col items-center">
            <CollegeCrestTile
              logoUrl={collegeLogoUrl}
              collegeName={collegeName}
              size="compact"
            />
            <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[48px] text-center">
              {collegeName.length > 8 ? collegeName.substring(0, 8) + '…' : collegeName}
            </span>
          </div>
        </div>
      )}

      {/* Chevron if clickable */}
      {onClick && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
      )}
    </button>
  );
};

export default LeaderRow;
