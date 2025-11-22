import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonAvatar } from '@/components/ui/skeleton-avatar';

interface YourGamesSkeletonProps {
  /** how many skeleton cards to show */
  count?: number;
}

export const YourGamesSkeleton: React.FC<YourGamesSkeletonProps> = ({ count = 2 }) => {
  return (
    <div role="status" aria-label="Loading your games" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

const SkeletonCard: React.FC = () => {
  return (
    <section
      className="rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,.5)] p-4"
      aria-hidden="true"
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-44 bg-white/10" />
        <Skeleton className="ml-auto h-6 w-24 rounded-full bg-white/10" />
        <Skeleton className="h-5 w-5 bg-white/10" />
      </div>

      {/* Meta rows */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3.5 w-56 bg-white/[0.08]" />
        <Skeleton className="h-3.5 w-40 bg-white/[0.08]" />
        <Skeleton className="h-3.5 w-48 bg-white/[0.08]" />
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-white/10" />

      {/* Players block (collapsed look) */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 bg-white/[0.08]" />
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" className="bg-white/10" style={{ borderRadius: '28%' }} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 bg-white/10" />
            <Skeleton className="h-3 w-28 bg-white/[0.08]" />
          </div>
        </div>
      </div>

      {/* Footer action row */}
      <div className="mt-3 flex gap-3">
        <Skeleton className="h-9 w-20 rounded-lg bg-white/10" />
        <Skeleton className="h-9 w-16 rounded-lg bg-white/10" />
        <Skeleton className="h-9 w-28 rounded-lg bg-white/10" />
      </div>
    </section>
  );
};
