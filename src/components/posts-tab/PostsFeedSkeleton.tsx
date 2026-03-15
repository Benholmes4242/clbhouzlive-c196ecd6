import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PostsFeedSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 px-0 animate-pulse">
      {/* YouTube-style skeleton */}
      <div className="bg-muted overflow-hidden">
        <div className="aspect-video bg-muted-foreground/10" />
        <div className="px-3 py-2 space-y-2">
          <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
          <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
        </div>
      </div>

      {/* 3x2 compact grid skeleton */}
      <div className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-muted rounded-[4px]" />
        ))}
      </div>

      {/* Review skeleton */}
      <div className="bg-muted overflow-hidden">
        <div className="h-[3px]" style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)' }} />
        <div className="px-3 py-2 space-y-2">
          <div className="h-4 bg-muted-foreground/10 rounded w-2/3" />
          <div className="h-3 bg-muted-foreground/10 rounded w-1/3" />
        </div>
        <div className="aspect-[4/3] bg-muted-foreground/10" />
        <div className="px-3 py-2">
          <div className="h-3 bg-muted-foreground/10 rounded w-full" />
        </div>
      </div>
    </div>
  );
};
