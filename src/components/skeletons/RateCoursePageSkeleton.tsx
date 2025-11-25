/**
 * RateCoursePageSkeleton
 * Skeleton loader for Rate/Edit Course page matching the form layout
 * Used during route lazy-loading and initial data fetch
 */

import { Skeleton } from "@/components/ui/skeleton";

export const RateCoursePageSkeleton = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen bg-background pb-24">
        {/* Header with back button */}
        <div className="relative h-[200px] bg-muted animate-pulse">
          <div className="absolute top-4 left-4">
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        <div className="px-6 -mt-4 space-y-6">
          {/* Course image card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          {/* Overall rating section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full mx-auto" />
          </div>

          {/* Share thoughts textarea */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Breakdown section */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-56" />
            
            {/* 4 breakdown sliders */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full ml-auto" />
              </div>
            ))}
          </div>

          {/* Media upload section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>

          {/* Primary button */}
          <div className="mt-3 flex w-full items-center justify-between gap-3">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
