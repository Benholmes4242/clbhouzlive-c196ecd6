import React from 'react';
import { cn } from '@/lib/utils';
import { ActiveSeasonCard } from './ActiveSeasonCard';
import { SeasonSponsorCard } from './SeasonSponsorCard';
import { type SeasonId, getSeasonConfig } from '@/lib/seasonConfig';
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
  seasonColor?: string;
  className?: string;
  // Sponsor props
  sponsorName?: string | null;
  prizeDescription?: string | null;
  leaderCourses?: number;
  yourCourses?: number;
  yourSeasonRank?: number;
  totalSeasonPlayers?: number;
}

/**
 * SeasonStatusPanel — No card wrapper, floats on page background.
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
  seasonColor,
  className,
  sponsorName,
  prizeDescription,
  leaderCourses,
  yourCourses,
  yourSeasonRank,
  totalSeasonPlayers,
}) => {
  if (isLoading) {
    return (
      <div className={cn(className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-[14px] mt-5" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className={cn(className)}>
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-6">
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
    <div className={cn(className, 'space-y-4')}>
      <ActiveSeasonCard
        seasonId={currentSeasonId}
        daysRemaining={daysRemaining}
        progressPercent={progressPercent}
        seasonData={seasonData}
        onSeasonSelect={onSeasonClick}
        seasonColor={seasonColor}
      />

      {sponsorName && prizeDescription && (
        <SeasonSponsorCard
          sponsorName={sponsorName}
          prizeDescription={prizeDescription}
          seasonColor={seasonColor ?? '#006747'}
          seasonLabel={getSeasonConfig(currentSeasonId).title}
          leaderCourses={leaderCourses ?? 0}
          yourCourses={yourCourses ?? 0}
          yourSeasonRank={yourSeasonRank ?? 0}
          totalSeasonPlayers={totalSeasonPlayers ?? 0}
          daysRemaining={daysRemaining}
        />
      )}
    </div>
  );
};

export default SeasonStatusPanel;
