import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Today section skeleton */}
      <section>
        <Skeleton className="h-3 w-12 mb-2" />
        <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
          {[...Array(3)].map((_, i) => (
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

      {/* Yesterday section skeleton */}
      <section>
        <Skeleton className="h-3 w-16 mb-2" />
        <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
          {[...Array(2)].map((_, i) => (
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
    </div>
  );
};
