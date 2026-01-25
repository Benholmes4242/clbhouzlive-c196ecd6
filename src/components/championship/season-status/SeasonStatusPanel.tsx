import React from 'react';
import { cn } from '@/lib/utils';
import { ActiveSeasonCard } from './ActiveSeasonCard';
import { SeasonChipsRow } from './SeasonChipsRow';
import { type SeasonId } from '@/lib/seasonConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SeasonStatusPanelProps {
  currentSeasonId: SeasonId;
  daysRemaining: number;
  progressPercent: number;
  seasonData: Record<SeasonId, { daysUntilAvailable?: number }>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSeasonClick?: (seasonId: SeasonId) => void;
  className?: string;
}

/**
 * SeasonStatusPanel - Container component for the Season Status UI
 * 
 * Contains:
 * - ActiveSeasonCard (hero card showing current season)
 * - SeasonChipsRow (horizontal navigation for other seasons)
 * 
 * Placement:
 * - Below main tab row (Championship | Courses | Explore | Handicap)
 * - Above leaderboard content
 * 
 * Spacing:
 * - 16px horizontal padding
 * - 12px from tab row
 * - 16-20px to leaderboard content
 */
export const SeasonStatusPanel: React.FC<SeasonStatusPanelProps> = ({
  currentSeasonId,
  daysRemaining,
  progressPercent,
  seasonData,
  isLoading,
  isError,
  onRetry,
  onSeasonClick,
  className,
}) => {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Card skeleton: Full width, ~180px height, 16px radius */}
        <Skeleton className="w-full h-[180px] rounded-2xl" />
        {/* Chips skeleton: 3 pills */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className={cn('rounded-2xl bg-muted/30 p-6', className)}>
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Unable to load season data</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            Tap to retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('pt-2 space-y-5', className)}>
      {/* Hero Card - Active Season */}
      <ActiveSeasonCard
        seasonId={currentSeasonId}
        daysRemaining={daysRemaining}
        progressPercent={progressPercent}
      />
      
      {/* Season Chips Row - 3 chips (excludes current) */}
      <SeasonChipsRow
        currentSeasonId={currentSeasonId}
        seasonData={seasonData}
        onSeasonClick={onSeasonClick}
      />
    </div>
  );
};

export default SeasonStatusPanel;
