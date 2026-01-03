import React from 'react';

/**
 * Skeleton loading components for My Progress page (G2)
 * Prevents content "jumping" when data loads
 */

export function Top100ProgressHeroSkeleton() {
  return (
    <div className="pt-4 pb-6 animate-pulse">
      <div className="flex items-center justify-between px-4" style={{ columnGap: '40px' }}>
        {/* Avatar skeleton */}
        <div 
          className="rounded-sq-md bg-muted"
          style={{ width: 'min(34vw, 140px)', height: 'min(34vw, 140px)', minWidth: '90px', minHeight: '90px' }}
        />
        {/* Badge card skeleton */}
        <div 
          className="rounded-sq-md bg-muted"
          style={{ width: 'min(42vw, 260px)', height: '92px', minWidth: '140px' }}
        />
      </div>
      {/* Text skeletons */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export function Top100YearSummarySkeleton() {
  return (
    <div className="px-2.5 mb-6 animate-pulse">
      <div className="bg-muted/40 border border-border/40 rounded-sq-md p-4 min-h-[72px]">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Top100MilestonesCarouselSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-2 mx-2.5" />
      <div className="h-3 w-40 bg-muted rounded mb-3 mx-2.5" />
      <div className="flex gap-4 overflow-hidden px-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
            <div className="h-14 w-14 rounded-sq-md bg-muted" />
            <div className="h-3 w-12 bg-muted rounded" />
            <div className="h-2 w-10 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="h-1 bg-muted rounded-full mx-2.5 mt-4" />
    </div>
  );
}

export function Top100RegionProgressSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-3 mx-2.5" />
      <div className="space-y-1.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-sq-sm border border-border/40 bg-card/60 px-3 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-sq-sm bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="w-24 space-y-1">
              <div className="h-2 w-16 bg-muted rounded ml-auto" />
              <div className="h-1.5 w-full bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Top100RecentRoundsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex justify-between items-center mb-3 px-2.5">
        <div className="h-4 w-36 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="flex gap-2 overflow-hidden px-2.5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-sq-md bg-muted h-48 min-w-[280px]" />
        ))}
      </div>
    </div>
  );
}

export function Top100ClosestBadgeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-3 px-2.5">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="mx-2.5 rounded-sq-md border border-border/40 bg-card/60 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded mt-3" />
            <div className="h-3 w-20 bg-muted rounded mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}