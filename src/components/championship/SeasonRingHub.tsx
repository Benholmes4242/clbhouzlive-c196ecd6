import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SeasonProgressRing } from './SeasonProgressRing';
import { SeasonCarousel } from './SeasonCarousel';
import { type SeasonId } from '@/lib/seasonConfig';

interface SeasonRingHubProps {
  currentSeasonId: SeasonId;
  daysRemaining: number;
  progressPercent: number; // 0-100
  seasonData: Record<SeasonId, { daysUntilAvailable?: number }>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSeasonSelect?: (seasonId: SeasonId) => void;
  className?: string;
}

/**
 * SeasonRingHub - Premium season navigation component
 * 
 * Design Philosophy:
 * - No cards, no shadows, no rounded containers
 * - Flat, glassy, system-level aesthetic
 * - Subtle micro-interactions that feel premium
 * - Golf-inspired color palette with soft opacity backgrounds
 * 
 * Layout:
 * - Season Progress Ring (centered, 200px)
 * - Season Carousel (12-16px below ring)
 */
export function SeasonRingHub({
  currentSeasonId,
  daysRemaining,
  progressPercent,
  seasonData,
  isLoading,
  isError,
  onRetry,
  onSeasonSelect,
  className,
}: SeasonRingHubProps) {
  // Convert 0-100 to 0-1 for ring
  const progress = Math.min(Math.max(progressPercent / 100, 0), 1);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('w-full px-4 py-6 flex flex-col items-center', className)}>
        {/* Ring skeleton */}
        <Skeleton className="w-[200px] h-[200px] rounded-full" />
        {/* Carousel skeleton */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('w-full px-4 py-8', className)}>
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
    <div className={cn('w-full py-6', className)}>
      {/* Season Progress Ring - centered, no card styling */}
      <div className="flex flex-col items-center">
        <SeasonProgressRing 
          seasonId={currentSeasonId}
          progress={progress}
          daysRemaining={daysRemaining}
          isLive={true}
        />
      </div>
      
      {/* Season Carousel - 12-16px below ring */}
      <div className="mt-3 pb-2">
        <SeasonCarousel 
          activeSeason={currentSeasonId}
          seasonData={seasonData}
          onSeasonSelect={onSeasonSelect}
        />
      </div>
    </div>
  );
}

export default SeasonRingHub;
