import React from 'react';

/**
 * Skeleton loading components for My Progress page (G2)
 * Uses clb-skeleton class for shimmer effect
 * Prevents content "jumping" when data loads
 */

export function Top100ProgressHeroSkeleton() {
  return (
    <div className="pt-4 pb-6">
      <div className="flex items-center justify-between px-4" style={{ columnGap: '40px' }}>
        {/* Avatar skeleton with shimmer */}
        <div 
          className="rounded-sq-md clb-skeleton"
          style={{ width: 'min(34vw, 140px)', height: 'min(34vw, 140px)', minWidth: '90px', minHeight: '90px' }}
        />
        {/* Badge card skeleton with shimmer */}
        <div 
          className="rounded-sq-md clb-skeleton"
          style={{ width: 'min(42vw, 260px)', height: '92px', minWidth: '140px' }}
        />
      </div>
      {/* Text skeletons */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="h-6 w-48 clb-skeleton rounded" />
        <div className="h-4 w-32 clb-skeleton rounded" />
      </div>
    </div>
  );
}

export function Top100YearSummarySkeleton() {
  return (
    <div className="px-4 mb-6">
      <div className="bg-card/60 border border-border/40 rounded-2xl p-5 min-h-[72px]">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 clb-skeleton rounded" />
              <div className="h-4 w-8 clb-skeleton rounded" />
              <div className="h-3 w-12 clb-skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Top100TimelineSkeleton() {
  return (
    <div className="bg-card/60 border border-border/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 clb-skeleton rounded" />
          <div className="h-4 w-24 clb-skeleton rounded" />
        </div>
        <div className="h-3 w-20 clb-skeleton rounded" />
      </div>
      <div className="flex items-end gap-1 h-16">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 clb-skeleton rounded-t"
            style={{ height: `${20 + (i % 3) * 25}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 h-2 clb-skeleton rounded" />
        ))}
      </div>
    </div>
  );
}

export function Top100StreakSkeleton() {
  return (
    <div className="bg-card/60 border border-border/40 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full clb-skeleton" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 clb-skeleton rounded" />
          <div className="h-3 w-40 clb-skeleton rounded" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-6 h-6 rounded-full clb-skeleton" />
            <div className="h-2 w-6 clb-skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Top100MilestonesCarouselSkeleton() {
  return (
    <div className="mt-6">
      <div className="h-4 w-24 clb-skeleton rounded mb-2 mx-2.5" />
      <div className="h-3 w-40 clb-skeleton rounded mb-3 mx-2.5" />
      <div className="flex gap-4 overflow-hidden px-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
            <div className="h-14 w-14 rounded-sq-md clb-skeleton" />
            <div className="h-3 w-12 clb-skeleton rounded" />
            <div className="h-2 w-10 clb-skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="h-1.5 clb-skeleton rounded-full mx-2.5 mt-4" />
    </div>
  );
}

export function Top100RegionProgressSkeleton() {
  return (
    <div className="w-full px-4">
      <div className="h-4 w-32 clb-skeleton rounded mb-4" />
      <div className="space-y-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-4 flex items-center gap-3 border-b border-slate-200/40 last:border-b-0">
            <div className="w-8 h-8 rounded-sq-sm clb-skeleton" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 clb-skeleton rounded" />
              <div className="h-3 w-24 clb-skeleton rounded" />
            </div>
            <div className="w-24 space-y-1">
              <div className="h-2 w-16 clb-skeleton rounded ml-auto" />
              <div className="h-1.5 w-full clb-skeleton rounded" />
            </div>
            <div className="w-4 h-4 clb-skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Top100RecentRoundsSkeleton() {
  return (
    <div className="w-full px-4">
      <div className="h-4 w-36 clb-skeleton rounded mb-4" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl clb-skeleton h-48 min-w-[280px] flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function Top100ClosestBadgeSkeleton() {
  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-24 clb-skeleton rounded" />
        <div className="h-3 w-20 clb-skeleton rounded" />
      </div>
      <div className="rounded-2xl border border-slate-200/40 bg-white/60 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full clb-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 clb-skeleton rounded" />
            <div className="h-4 w-32 clb-skeleton rounded" />
            <div className="h-2 w-full clb-skeleton rounded mt-3" />
            <div className="h-3 w-20 clb-skeleton rounded mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Top100ListCompletionsSkeleton() {
  return (
    <div className="px-4">
      <div className="h-4 w-40 clb-skeleton rounded mb-4" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[140px] h-[180px] rounded-2xl clb-skeleton flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}
