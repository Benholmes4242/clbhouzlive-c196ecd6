import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * VideosSectionSkeleton - Loading skeleton for a single video section
 * Shows featured landscape + 2-column portrait grid skeleton
 */
export const VideosSectionSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4">
        <div className="space-y-1">
          <Skeleton className="w-40 h-5 rounded" />
          <Skeleton className="w-32 h-4 rounded" />
        </div>
        <Skeleton className="w-16 h-4 rounded" />
      </div>

      {/* Featured landscape skeleton */}
      <div className="px-4">
        <Skeleton className="w-full aspect-video rounded-sm" />
      </div>

      {/* Portrait grid skeleton */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="aspect-[3/4] rounded-sm" />
          <Skeleton className="aspect-[3/4] rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export default VideosSectionSkeleton;
