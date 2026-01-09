/**
 * GameDetailSkeleton - Skeleton loading state for game detail sheet
 * Renders instantly with fixed heights to prevent layout jump
 */

import React from 'react';

export function GameDetailSkeleton() {
  return (
    <div className="px-5 py-4 space-y-4">
      {/* Action buttons skeleton */}
      <div className="flex justify-end gap-2">
        <div className="h-8 w-20 bg-black/5 rounded-full animate-pulse" />
        <div className="h-8 w-8 bg-black/5 rounded-full animate-pulse" />
      </div>

      {/* Tab pills skeleton - matches GameDetailTabPills height */}
      <div 
        className="flex gap-1.5 p-1 rounded-[14px] animate-pulse"
        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex-1 h-8 bg-white/60 rounded-[10px]" />
        <div className="flex-1 h-8 bg-transparent rounded-[10px]" />
        <div className="flex-1 h-8 bg-transparent rounded-[10px]" />
      </div>

      {/* Content cards skeleton - V2 glass card style */}
      <div className="space-y-3 pt-2">
        {/* Location card */}
        <div 
          className="flex items-center gap-3.5 p-4 rounded-2xl animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="w-10 h-10 bg-black/5 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 bg-black/5 rounded-lg" />
          </div>
        </div>

        {/* Date card */}
        <div 
          className="flex items-center gap-3.5 p-4 rounded-2xl animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="w-10 h-10 bg-black/5 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-40 bg-black/5 rounded-lg" />
            <div className="h-3 w-16 bg-black/5 rounded-lg" />
          </div>
        </div>

        {/* Slots card */}
        <div 
          className="flex items-center gap-3.5 p-4 rounded-2xl animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="w-10 h-10 bg-black/5 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 bg-black/5 rounded-lg" />
            <div className="h-3 w-28 bg-black/5 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-5 py-3"
        style={{ 
          background: 'rgba(249, 250, 251, 0.95)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="h-12 bg-black/5 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
