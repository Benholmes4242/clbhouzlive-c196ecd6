/**
 * TripDetailSkeleton - Loading skeleton for trip detail sheet
 * Matches GameDetailSkeleton design
 */

import React from 'react';

export function TripDetailSkeleton() {
  return (
    <div className="flex-1 px-5 py-4 space-y-4 animate-pulse">
      {/* Action row skeleton */}
      <div className="flex justify-end gap-2">
        <div className="h-8 w-20 bg-black/5 rounded-full" />
        <div className="h-8 w-8 bg-black/5 rounded-full" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="h-10 bg-black/5 rounded-[14px]" />
      
      {/* Cards skeleton */}
      <div className="space-y-3">
        <div className="h-[72px] bg-black/5 rounded-2xl" />
        <div className="h-[72px] bg-black/5 rounded-2xl" />
        <div className="h-[72px] bg-black/5 rounded-2xl" />
      </div>
    </div>
  );
}
