import React from 'react';

export function GolferCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border/60 rounded-2xl animate-pulse">
      {/* Avatar skeleton */}
      <div className="h-12 w-12 flex-shrink-0 rounded-full bg-slate-200" />

      {/* Details skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-3 bg-slate-200 rounded w-48" />
      </div>

      {/* Button skeleton */}
      <div className="h-8 w-24 bg-slate-200 rounded-lg flex-shrink-0" />
    </div>
  );
}
