import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { VideosSectionSkeleton } from './VideosSectionSkeleton';

/**
 * VideosTabSkeleton - Full tab loading skeleton
 * Shows search/filter skeleton + multiple section skeletons
 */
export const VideosTabSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Search/filter skeleton */}
      <div className="px-4 pt-4 space-y-3">
        <Skeleton className="w-full h-12 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-10 rounded-xl" />
          <Skeleton className="w-px h-6 self-center" />
          <Skeleton className="w-12 h-10 rounded-full" />
          <Skeleton className="w-24 h-10 rounded-full" />
          <Skeleton className="w-20 h-10 rounded-full" />
        </div>
      </div>

      {/* Section skeletons */}
      <VideosSectionSkeleton />
      <VideosSectionSkeleton />
      <VideosSectionSkeleton />
    </div>
  );
};

export default VideosTabSkeleton;
