/**
 * WatchTabSkeleton - Full page loading skeleton for Watch tab
 * 
 * Shows skeleton placeholders for:
 * - Hero video (16:9 with creator info)
 * - Suggested for you section (avatars)
 * - Shorts grid (6 cards)
 */

import { Skeleton } from '@/components/ui/skeleton';

export function WatchTabSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      {/* Hero Skeleton - full bleed */}
      <div className="pt-4">
        <Skeleton className="w-full aspect-[16/9]" />
        <div className="flex items-center gap-2.5 mt-3 px-4">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        </div>
      </div>

      {/* Gap */}
      <div className="h-4" />

      {/* Suggested For You Skeleton */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-32 h-4 rounded" />
          <Skeleton className="w-16 h-4 rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-14 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Gap */}
      <div className="h-4" />

      {/* Grid Skeleton - pointed corners */}
      <div className="py-2">
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default WatchTabSkeleton;
