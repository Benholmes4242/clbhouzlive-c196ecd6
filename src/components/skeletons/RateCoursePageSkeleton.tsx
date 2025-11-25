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
        {/* Header with back button - Section A (light) */}
        <div className="relative h-[200px] bg-slate-50 animate-pulse">
          <div className="absolute top-4 left-4">
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        <div className="space-y-0">
          {/* Overall rating section - Section A continued (light) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-50">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full mx-auto" />
          </div>

          {/* Share thoughts textarea - Section B (dark) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Breakdown section - Section C (light) */}
          <div className="space-y-4 px-6 pt-6 pb-3 bg-slate-50">
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

          {/* Media upload section - Section D (dark) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>

          {/* Primary button - Section E (light) */}
          <div className="flex w-full items-center justify-between gap-3 px-6 pt-6 pb-3 bg-slate-50">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
