/**
 * Profile skeleton helper components
 * These are exported from ProfileSkeleton.tsx for backwards compatibility
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar } from "@/components/ui/skeleton-avatar"
import { SkeletonText } from "@/components/ui/skeleton-text"

export const ProfileHeaderSkeleton = () => {
  return (
    <div className="relative">
      <div className="relative h-48 bg-surface-alt">
        <div className="absolute -bottom-12 left-6">
          <SkeletonAvatar size="xl" className="border-4 border-background" />
        </div>
      </div>
      
      <div className="px-6 pt-16 pb-4 space-y-3">
        <SkeletonText lines={1} variant="heading" className="w-48" />
        <SkeletonText lines={1} variant="body" className="w-32" />
        <SkeletonText lines={1} variant="meta" className="w-64" />
      </div>
      
      <div className="px-6 pb-4 flex gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileTabsSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="border-b border-border">
        <div className="flex gap-6 px-6">
          {['Activity', 'Courses', 'Stats'].map((tab) => (
            <Skeleton key={tab} className="h-10 w-20" />
          ))}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="md" />
              <div className="flex-1">
                <SkeletonText lines={2} />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ActivityFeedSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
              <SkeletonText lines={2} />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface-card rounded-2xl p-4 space-y-2">
            <Skeleton className="h-8 w-16" />
            <SkeletonText lines={1} variant="meta" />
          </div>
        ))}
      </div>
    </div>
  );
};
