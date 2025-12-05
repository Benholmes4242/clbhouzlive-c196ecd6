import React from 'react';

export function GolferCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-2xl animate-pulse">
      {/* Left side: Avatar + text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Squircle avatar skeleton - new spec: 1/1.05 aspect ratio, 34% border radius */}
        <div 
          className="flex-shrink-0 bg-slate-200 border border-gray-300" 
          style={{ width: 56, aspectRatio: '1 / 1.05', borderRadius: '34%' }} 
        />

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
