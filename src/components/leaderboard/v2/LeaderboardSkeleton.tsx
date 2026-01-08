/**
 * LeaderboardSkeleton - Loading states for the leaderboard
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardHeroSkeleton() {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40">
      <div className="px-5 pt-6 pb-5 space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-60" />
      </div>
    </div>
  );
}

export function LeaderboardStatusSkeleton() {
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-border/40 bg-card/50 p-4">
      <div className="flex items-start gap-3.5">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-8 w-12 ml-auto" />
          <Skeleton className="h-3 w-8 ml-auto" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

export function LeaderboardTabsSkeleton() {
  return (
    <div className="px-4 py-3">
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardRivalsSkeleton() {
  return (
    <div className="mx-4 mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-7 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardFullSkeleton() {
  return (
    <div className="w-full">
      <LeaderboardHeroSkeleton />
      <LeaderboardStatusSkeleton />
      <LeaderboardTabsSkeleton />
      <LeaderboardRivalsSkeleton />
      <div className="h-px bg-border/30 mx-4 my-4" />
      <LeaderboardListSkeleton count={8} />
    </div>
  );
}
