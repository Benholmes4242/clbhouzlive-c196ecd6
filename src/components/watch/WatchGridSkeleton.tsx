import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const WatchGridSkeleton: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* Category chips skeleton */}
      <div className="flex gap-2 px-4 py-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[32px] shrink-0 rounded-full"
            style={{ width: i === 0 ? 48 : i === 1 ? 64 : 72 }}
          />
        ))}
      </div>

      {/* Trending strip skeleton */}
      <div style={{ padding: '14px 16px 10px', borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
        <Skeleton className="h-4 w-36 rounded mb-3" />
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[130px] aspect-[4/5] rounded-[4px]" />
          ))}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-[2px] px-[2px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton className="aspect-[4/5] rounded-[4px]" />
            <div className="absolute bottom-1.5 right-1.5">
              <Skeleton className="h-[16px] w-[32px] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchGridSkeleton;
