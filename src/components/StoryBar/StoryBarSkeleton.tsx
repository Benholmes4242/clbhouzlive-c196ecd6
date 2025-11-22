
import React from 'react';
import { SkeletonAvatar } from '@/components/ui/skeleton-avatar';
import { Skeleton } from '@/components/ui/skeleton';

const StoryBarSkeleton = () => {
  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-0 py-2">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Loading skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-1 min-w-0">
              <SkeletonAvatar size="lg" />
              <Skeleton className="w-16 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryBarSkeleton;
