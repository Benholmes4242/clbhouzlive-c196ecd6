import React from 'react';

export function GolferCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-2xl animate-pulse">
      {/* Left side: Avatar + text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Squircle avatar skeleton */}
        <div className="h-14 w-14 flex-shrink-0 bg-slate-200" style={{ borderRadius: '22%' }} />

        {/* Details skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-3 bg-slate-200 rounded w-48" />
        </div>
      </div>

      {/* Right side: Stacked buttons skeleton */}
      <div className="flex flex-col gap-2 ml-3 shrink-0 w-[110px]">
        <div className="h-9 w-full bg-slate-200 rounded-lg" />
        <div className="h-9 w-full bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}
