/**
 * Phase 1 Perf: Skeleton loader for Profile page
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar } from "@/components/ui/skeleton-avatar"
import { SkeletonText } from "@/components/ui/skeleton-text"

export * from './ProfileSkeletonHelpers';

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background page-with-header">
      {/* Hero header skeleton */}
      <div className="relative h-48 bg-surface-alt">
        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <SkeletonAvatar size="xl" className="border-4 border-background" />
        </div>
      </div>
      
      {/* Profile info */}
      <div className="px-6 pt-16 pb-4 space-y-3">
        <SkeletonText lines={1} variant="heading" className="w-48" />
        <SkeletonText lines={1} variant="body" className="w-32" />
        <SkeletonText lines={1} variant="meta" className="w-64" />
      </div>
      
      {/* Stats row */}
      <div className="px-6 pb-4 flex gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6 px-6">
          {['Activity', 'Courses', 'Stats'].map((tab) => (
            <Skeleton key={tab} className="h-10 w-20" />
          ))}
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="p-4 grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
};
