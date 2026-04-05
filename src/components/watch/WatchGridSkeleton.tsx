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
            className="h-[30px] shrink-0 rounded-full"
            style={{ width: i === 0 ? 48 : i === 1 ? 64 : 72 }}
          />
        ))}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-[2px] px-[2px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton className="aspect-[4/5] rounded-[4px]" />
            {/* Duration badge placeholder */}
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
