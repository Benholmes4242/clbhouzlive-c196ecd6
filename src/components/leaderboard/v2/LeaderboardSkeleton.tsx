/**
 * LeaderboardSkeleton - Loading states matching the updated layout
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Shimmer overlay class for premium loading feel
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export function LeaderboardHeroSkeleton() {
  // Centered content on page background (no card)
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-2">
      {/* Trophy icon placeholder */}
      <Skeleton className="h-8 w-8 rounded-full" />
      {/* Title */}
      <Skeleton className="h-6 w-48" />
      {/* Subtitle */}
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export function LeaderboardStatusSkeleton() {
  return (
    <div className={cn(
      "mx-4 p-4 rounded-xl border border-border/60 bg-card shadow-sm",
      shimmerClass
    )}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Skeleton className="h-16 w-16 rounded-full" />
        {/* Rank info */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" /> {/* "YOUR RANK" label */}
          <Skeleton className="h-6 w-24" /> {/* "#52 Global" */}
          <Skeleton className="h-3 w-20" /> {/* "Founders Club" */}
        </div>
        {/* Score */}
        <div className="text-right space-y-1">
          <Skeleton className="h-8 w-10 ml-auto" /> {/* "22" */}
          <Skeleton className="h-3 w-8 ml-auto" /> {/* "/ 100" */}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" /> {/* "Next: Heritage Club" */}
          <Skeleton className="h-3 w-20" /> {/* "28 courses away" */}
        </div>
        <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
      </div>
      {/* Tabs (Rivals, History, Log) */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-border/40">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function LeaderboardTabsSkeleton() {
  // Underlined tabs matching header style, no bottom border
  return (
    <div className="px-4 pt-5 pb-2">
      <div className="flex items-center gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="py-2.5">
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      {/* Description text */}
      <div className="mt-3">
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}

export function LeaderboardFiltersSkeleton() {
  // Two side-by-side dropdowns (50% width each)
  return (
    <div className="flex gap-3 px-4 pb-4">
      {/* Golfers Based In dropdown skeleton */}
      <div className="flex-1">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      {/* Time Range dropdown skeleton */}
      <div className="flex-1">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
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

export function LeaderboardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/40">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            shimmerClass
          )}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Rank */}
          <Skeleton className="h-5 w-8" />
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-xl" />
          {/* Name & club */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Score & badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-8" />
            <Skeleton className={cn(
              "rounded-full",
              i < 3 ? "h-8 w-10" : "h-6 w-10"
            )} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardFullSkeleton() {
  return (
    <div className="w-full animate-in fade-in duration-300 space-y-0">
      {/* Hero - centered, no card */}
      <LeaderboardHeroSkeleton />
      
      {/* User rank card */}
      <LeaderboardStatusSkeleton />
      
      {/* Arena tabs - underlined style */}
      <LeaderboardTabsSkeleton />
      
      {/* Filter dropdowns - side by side */}
      <LeaderboardFiltersSkeleton />
      
      {/* Leaderboard rows */}
      <LeaderboardListSkeleton count={6} />
    </div>
  );
}
