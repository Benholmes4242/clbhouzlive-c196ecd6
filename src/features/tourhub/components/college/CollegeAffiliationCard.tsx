/**
 * CollegeAffiliationCard - Profile embed showing college connection
 * Used on player profiles and user profiles
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { CollegeCrestTile } from './CollegeCrestTile';

type AffiliationType = 'alumni' | 'representing' | 'played_for';

interface CollegeAffiliationCardProps {
  collegeName: string;
  logoUrl?: string | null;
  affiliationType?: AffiliationType;
  playersOnTour?: number;
  topRankedAlumni?: number;
  onViewLeaderboard?: () => void;
  className?: string;
}

const affiliationLabels: Record<AffiliationType, string> = {
  alumni: 'Alumni',
  representing: 'Representing',
  played_for: 'Played for',
};

export const CollegeAffiliationCard: React.FC<CollegeAffiliationCardProps> = ({
  collegeName,
  logoUrl,
  affiliationType = 'alumni',
  playersOnTour,
  topRankedAlumni,
  onViewLeaderboard,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-sq-md',
        'bg-white/60 dark:bg-white/5',
        'border border-border/20 dark:border-white/5',
        className
      )}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-1.5 mb-3">
        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          College
        </span>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-3">
        <CollegeCrestTile
          logoUrl={logoUrl}
          collegeName={collegeName}
          size="standard"
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {collegeName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {affiliationLabels[affiliationType]}
          </p>
        </div>
      </div>

      {/* Stats hook (optional) */}
      {(playersOnTour !== undefined || topRankedAlumni !== undefined) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10">
          {playersOnTour !== undefined && (
            <div>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {playersOnTour}
              </p>
              <p className="text-[10px] text-muted-foreground">On Tour</p>
            </div>
          )}
          {topRankedAlumni !== undefined && (
            <div>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                #{topRankedAlumni}
              </p>
              <p className="text-[10px] text-muted-foreground">Top Alumni</p>
            </div>
          )}
        </div>
      )}

      {/* View leaderboard link */}
      {onViewLeaderboard && (
        <button
          onClick={onViewLeaderboard}
          className={cn(
            'flex items-center gap-1 mt-3 pt-3 border-t border-border/10',
            'text-xs font-medium text-brand-orange',
            'hover:opacity-80 transition-opacity'
          )}
        >
          View college leaderboard
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default CollegeAffiliationCard;
