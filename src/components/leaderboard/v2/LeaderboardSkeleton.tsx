/**
 * LeaderboardSkeleton - Enhanced loading states with shimmer animations
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Shimmer overlay class for premium loading feel
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export function LeaderboardHeroSkeleton() {
  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        shimmerClass
      )}
      style={{
        background: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 50%, #1F1F1F 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="px-4 py-3.5 space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-5 h-5 rounded bg-white/10" />
          <Skeleton className="h-5 w-36 bg-white/10" />
        </div>
        <Skeleton className="h-3 w-56 bg-white/10" />
      </div>
    </div>
  );
}

export function LeaderboardStatusSkeleton() {
  return (
    <div className={cn(
      "mx-4 mt-4 rounded-2xl border border-border/40 bg-card/50 p-4",
      shimmerClass
    )}>
      <div className="flex items-start gap-3.5">
        {/* Avatar skeleton with ring effect */}
        <div className="relative">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="absolute inset-0 rounded-xl ring-2 ring-muted/30" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="text-right space-y-1.5">
          <Skeleton className="h-8 w-10 ml-auto" />
          <Skeleton className="h-3 w-8 ml-auto" />
        </div>
      </div>
      {/* Progress bar skeleton */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
          <Skeleton className="h-full w-1/3 rounded-full" />
        </div>
      </div>
      {/* CTA buttons skeleton */}
      <div className="flex border-t border-border/40 mt-4 pt-3 -mx-4 -mb-4 px-4 pb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center gap-2 py-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardTabsSkeleton() {
  return (
    <div className="px-4 py-3">
      <div className="flex gap-1.5 overflow-hidden">
        {[80, 100, 110, 90, 70].map((width, i) => (
          <Skeleton 
            key={i} 
            className="h-8 rounded-full flex-shrink-0" 
            style={{ width: `${width}px` }}
          />
        ))}
      </div>
      <Skeleton className="h-3 w-48 mt-2" />
    </div>
  );
}

export function LeaderboardRivalsSkeleton() {
  return (
    <div className="mx-4 mt-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Rival rows with connector line */}
      <div className="relative">
        <div className="absolute left-[2.75rem] top-0 bottom-0 w-px bg-muted/20" />
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                i === 2 && "bg-primary/[0.06] border-2 border-primary/20"
              )}
            >
              <Skeleton className="w-8 h-4 rounded" />
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-6 ml-auto" />
                <Skeleton className="h-2.5 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            shimmerClass
          )}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Skeleton className="w-11 h-11 rounded-xl" />
          </div>
          {/* Info */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          {/* Count */}
          <Skeleton className="h-4 w-6" />
          {/* Rank badge */}
          <Skeleton className={cn(
            "rounded-full",
            i < 3 ? "w-9 h-9" : "w-8 h-7"
          )} />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardFullSkeleton() {
  return (
    <div className="w-full animate-in fade-in duration-300">
      <LeaderboardHeroSkeleton />
      <LeaderboardStatusSkeleton />
      <LeaderboardTabsSkeleton />
      <LeaderboardRivalsSkeleton />
      <div className="h-px bg-border/30 mx-4 my-4" />
      <LeaderboardListSkeleton count={8} />
    </div>
  );
}
