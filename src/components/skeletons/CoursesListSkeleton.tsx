/**
 * Phase 1 Perf: Skeleton loader for Courses Explorer / Top 100 lists
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonText } from "@/components/ui/skeleton-text"

export const CoursesListSkeleton = () => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 pb-6">
      {/* Search bar skeleton */}
      <Skeleton className="h-11 w-full rounded-lg" />
      
      {/* Filters skeleton */}
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats row skeleton */}
      <div className="flex items-center justify-between text-sm">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Course cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <Skeleton className="w-10 h-10 rounded-lg" />
              
              {/* Thumbnail */}
              <Skeleton className="w-16 h-16 rounded-lg" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <SkeletonText lines={1} variant="heading" className="w-3/4" />
                <SkeletonText lines={1} variant="body" className="w-1/2" />
              </div>
              
              {/* Chevron */}
              <Skeleton className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
