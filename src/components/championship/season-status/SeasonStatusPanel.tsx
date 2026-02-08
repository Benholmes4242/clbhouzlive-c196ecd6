import React from 'react';
import { cn } from '@/lib/utils';
import { ActiveSeasonCard } from './ActiveSeasonCard';
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
      <div className={cn('px-4', className)}>
        <Skeleton className="w-full h-[160px] rounded-2xl" />
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className={cn('px-4', className)}>
        <div className="rounded-2xl bg-muted/50 p-6">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to load season data</p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              Tap to retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('px-4 pt-2', className)}>
      <ActiveSeasonCard
        seasonId={currentSeasonId}
        daysRemaining={daysRemaining}
        progressPercent={progressPercent}
        seasonData={seasonData}
        onSeasonSelect={onSeasonClick}
      />
    </div>
  );
};

export default SeasonStatusPanel;