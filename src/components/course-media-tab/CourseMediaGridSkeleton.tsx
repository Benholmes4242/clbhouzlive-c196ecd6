import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseMediaGridSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3">
    {/* Header skeleton */}
    <div className="px-4 pt-3 pb-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-10 w-16 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>
    </div>
    {/* Grid skeleton */}
    <div className="grid grid-cols-2 gap-[2px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={`tile-${i}`} className="aspect-[4/5] rounded-[4px]" />
      ))}
      <Skeleton className="col-span-2 aspect-video rounded-[4px]" />
    </div>
  </div>
);
