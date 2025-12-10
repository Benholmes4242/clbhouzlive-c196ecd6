/**
 * ActivityPageSkeleton
 * Full-page skeleton for Activity (notifications) page
 * Used as Suspense fallback during lazy load
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ActivityPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header area */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/40">
        {/* Safe area + header */}
        <div className="px-4 pt-14 pb-3">
          <Skeleton className="h-7 w-32 mx-auto" />
        </div>
        
        {/* Tabs skeleton */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-9 w-16 rounded-sq-pill" />
            <Skeleton className="h-9 w-20 rounded-sq-pill" />
            <Skeleton className="h-9 w-16 rounded-sq-pill" />
          </div>
        </div>
        
        {/* Chips skeleton */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto max-w-[640px] mx-auto">
            <Skeleton className="h-8 w-20 rounded-sq-pill flex-shrink-0" />
            <Skeleton className="h-8 w-24 rounded-sq-pill flex-shrink-0" />
            <Skeleton className="h-8 w-20 rounded-sq-pill flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-[640px] mx-auto px-4 sm:px-5 py-4 space-y-6">
        {/* New section */}
        <section>
          <Skeleton className="h-3 w-12 mb-2" />
          <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="w-1 h-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-sq-sm flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12 rounded-sq-pill" />
              </div>
            ))}
          </div>
        </section>

        {/* Today section */}
        <section>
          <Skeleton className="h-3 w-14 mb-2" />
          <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="w-1 h-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-sq-sm flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-12 rounded-sq-pill" />
              </div>
            ))}
          </div>
        </section>

        {/* Earlier section */}
        <section>
          <Skeleton className="h-3 w-16 mb-2" />
          <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="w-1 h-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-sq-sm flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ActivityPageSkeleton;
