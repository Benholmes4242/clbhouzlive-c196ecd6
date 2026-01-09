/**
 * HubContentSkeleton - Skeleton loader for Hub content
 * Matches exact shapes to prevent reflow
 */

import React from 'react';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div 
      className={`rounded-[22px] animate-pulse ${className || ''}`}
      style={{ 
        background: 'rgba(0, 0, 0, 0.04)',
      }}
    />
  );
}

function SkeletonBar({ width, height = 'h-4' }: { width: string; height?: string }) {
  return (
    <div 
      className={`${width} ${height} rounded-full animate-pulse`}
      style={{ background: 'rgba(0, 0, 0, 0.06)' }}
    />
  );
}

function SkeletonCircle({ size }: { size: string }) {
  return (
    <div 
      className={`${size} rounded-full animate-pulse`}
      style={{ background: 'rgba(0, 0, 0, 0.06)' }}
    />
  );
}

export function HubContentSkeleton() {
  return (
    <>
      {/* Header skeleton - greeting + icon */}
      <div className="flex items-center justify-between">
        <SkeletonBar width="w-[60%]" height="h-8" />
        <SkeletonCircle size="h-10 w-10" />
      </div>

      {/* Hero tile skeleton - matches 165px height */}
      <SkeletonBlock className="h-[165px]" />

      {/* Messages card skeleton */}
      <div 
        className="rounded-[22px] p-4"
        style={{ 
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <SkeletonCircle size="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <SkeletonBar width="w-24" height="h-5" />
            <SkeletonBar width="w-full" height="h-3" />
          </div>
        </div>
      </div>

      {/* Two-card grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-[130px]" />
        <SkeletonBlock className="h-[130px]" />
      </div>

      {/* Your Games card skeleton */}
      <div 
        className="rounded-[22px] p-4"
        style={{ 
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center gap-4">
          <SkeletonCircle size="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <SkeletonBar width="w-28" height="h-5" />
            <SkeletonBar width="w-full" height="h-3" />
          </div>
        </div>
      </div>
    </>
  );
}
