/**
 * GameDetailSkeleton - Skeleton loading state for game detail sheet
 */

import React from 'react';

export function GameDetailSkeleton() {
  return (
    <div className="animate-pulse px-5 py-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-black/5 rounded-lg" />
          <div className="h-3 w-28 bg-black/5 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-black/5 rounded-full" />
          <div className="h-8 w-8 bg-black/5 rounded-full" />
        </div>
      </div>

      {/* Tab pills skeleton */}
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-black/5 rounded-full" />
        <div className="h-7 w-20 bg-black/5 rounded-full" />
        <div className="h-7 w-28 bg-black/5 rounded-full" />
      </div>

      {/* Content cards skeleton */}
      <div className="space-y-3">
        <div className="h-16 bg-black/5 rounded-xl" />
        <div className="h-16 bg-black/5 rounded-xl" />
        <div className="h-16 bg-black/5 rounded-xl" />
      </div>

      {/* Footer skeleton */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-3">
        <div className="h-12 bg-black/5 rounded-xl" />
      </div>
    </div>
  );
}
