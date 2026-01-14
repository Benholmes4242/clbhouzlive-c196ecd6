/**
 * SkeletonLoader - Loading skeletons for games/trips
 */

import React from 'react';

function Shimmer() {
  return (
    <div 
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
      }}
    />
  );
}

export function HeroCardSkeleton() {
  return (
    <div 
      className="w-full rounded-[18px] p-4 overflow-hidden relative"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Shimmer />
      
      {/* Title skeleton */}
      <div 
        className="h-5 w-3/4 rounded-md mb-2"
        style={{ background: 'rgba(0, 0, 0, 0.06)' }}
      />
      
      {/* Date skeleton */}
      <div 
        className="h-4 w-1/2 rounded-md mb-4"
        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
      />
      
      {/* Bottom row skeleton */}
      <div className="flex items-center gap-4">
        <div 
          className="h-3 w-16 rounded-md"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        />
        <div 
          className="h-3 w-20 rounded-md"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div 
      className="w-full px-3.5 py-3 rounded-[16px] overflow-hidden relative"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      <Shimmer />
      
      {/* Title skeleton */}
      <div 
        className="h-4 w-3/4 rounded-md mb-2"
        style={{ background: 'rgba(0, 0, 0, 0.05)' }}
      />
      
      {/* Date skeleton */}
      <div 
        className="h-3.5 w-1/2 rounded-md mb-2"
        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
      />
      
      {/* Bottom row skeleton */}
      <div 
        className="h-3 w-20 rounded-md"
        style={{ background: 'rgba(0, 0, 0, 0.03)' }}
      />
    </div>
  );
}

export function SkeletonList({ includeHero = false }: { includeHero?: boolean }) {
  return (
    <div className="space-y-2">
      {includeHero && <HeroCardSkeleton />}
      {Array.from({ length: 6 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
