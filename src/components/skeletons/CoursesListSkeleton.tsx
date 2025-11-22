/**
 * Phase 1 Perf: Skeleton loader for Courses Explorer / Top 100 lists
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonText } from "@/components/ui/skeleton-text"

export const CoursesListSkeleton = () => {
  return (
    <div className="min-h-screen bg-background page-with-header">
      <main className="px-4 md:container md:mx-auto md:px-0 pt-[72px] pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            {/* Title and subtitle */}
            <div className="text-center space-y-1 -mt-8 md:-mt-7 mb-4">
              <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
              <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex justify-center gap-2 px-4 pb-2">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>

            {/* Search bar skeleton */}
            <Skeleton className="h-11 w-full rounded-lg max-w-2xl mx-auto" />
            
            {/* Filters skeleton */}
            <div className="flex gap-2 justify-center">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            
            {/* Stats row skeleton */}
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            {/* Course cards skeleton */}
            <div className="space-y-3 max-w-2xl mx-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-surface-card rounded-2xl border border-border p-4">
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
        </div>
      </main>
    </div>
  );
};
