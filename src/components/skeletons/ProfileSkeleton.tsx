/**
 * Phase 1 Perf: Skeleton loader for Profile page
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar } from "@/components/ui/skeleton-avatar"
import { SkeletonText } from "@/components/ui/skeleton-text"

export * from './ProfileSkeletonHelpers';

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-28 relative overflow-hidden">
      {/* Spacer for fixed header */}
      <div className="h-16 md:h-18" />
      
      {/* Hero header skeleton */}
      <div className="relative h-64 bg-surface-alt">
        {/* Hero image placeholder */}
        <Skeleton className="absolute inset-0" />
        
        {/* Avatar overlay at bottom */}
        <div className="absolute bottom-4 left-6">
          <SkeletonAvatar size="xl" className="border-4 border-background" />
        </div>
      </div>
      
      {/* Profile info */}
      <div className="px-6 pt-4 pb-4 space-y-3">
        <div className="space-y-1">
          <SkeletonText lines={1} variant="heading" className="w-48" />
          <SkeletonText lines={1} variant="body" className="w-32" />
        </div>
        <SkeletonText lines={2} variant="body" className="w-full max-w-md" />
      </div>
      
      {/* Stats row */}
      <div className="px-6 pb-4 flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-6">
          {['Activity', 'Courses', 'Top 100', 'Stats'].map((tab) => (
            <Skeleton key={tab} className="h-12 w-20 rounded-lg" />
          ))}
        </div>
      </div>
      
      {/* Reviews strip skeleton */}
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        
        {/* Review cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonText lines={1} variant="heading" className="w-3/4" />
                  <SkeletonText lines={1} variant="body" className="w-1/2" />
                </div>
              </div>
              <SkeletonText lines={2} variant="body" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
