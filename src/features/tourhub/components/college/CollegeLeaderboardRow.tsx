/**
 * CollegeLeaderboardRow - Standard row for college vs college leaderboards
 * Building block for all college leaderboards
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { CollegeCrestTile } from './CollegeCrestTile';
import { CollegeRankBadge } from './CollegeRankBadge';
import { MomentumPip, MomentumType } from './MomentumPip';

interface CollegeLeaderboardRowProps {
  rank: number;
  collegeName: string;
  logoUrl?: string | null;
  region?: string;
  metric?: string | number;
  metricLabel?: string;
  momentum?: MomentumType;
  playersOnTour?: number;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export const CollegeLeaderboardRow: React.FC<CollegeLeaderboardRowProps> = ({
  rank,
  collegeName,
  logoUrl,
  region,
  metric,
  metricLabel,
  momentum,
  playersOnTour,
  onClick,
  showChevron = true,
  className,
}) => {
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-sq-md',
        'bg-white/60 dark:bg-white/5',
        'border border-border/20 dark:border-white/5',
        // Hover & press states
        onClick && [
          'hover:bg-white/80 dark:hover:bg-white/8',
          'active:scale-[0.98] active:shadow-sm',
        ],
        'transition-all duration-motion-fast ease-out',
        // Top 3 get subtle highlight
        isTop3 && 'bg-white/80 dark:bg-white/8',
        className
      )}
    >
      {/* Left: Rank badge */}
      <CollegeRankBadge rank={rank} size="md" />

      {/* Crest tile */}
      <CollegeCrestTile
        logoUrl={logoUrl}
        collegeName={collegeName}
        size="standard"
        variant={isTop3 ? 'highlighted' : 'standard'}
      />

      {/* Center: Name + region */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm text-foreground truncate">
          {collegeName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {region && (
            <span className="text-xs text-muted-foreground">{region}</span>
          )}
          {playersOnTour !== undefined && (
            <span className="text-xs text-muted-foreground/70">
              {playersOnTour} on Tour
            </span>
          )}
        </div>
      </div>

      {/* Right: Metric + momentum */}
      <div className="flex items-center gap-2">
        {momentum && <MomentumPip type={momentum} />}
        
        {metric !== undefined && (
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground tabular-nums">
              {typeof metric === 'number' ? metric.toLocaleString() : metric}
            </p>
            {metricLabel && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {metricLabel}
              </p>
            )}
          </div>
        )}

        {showChevron && onClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        )}
      </div>
    </button>
  );
};

export default CollegeLeaderboardRow;
