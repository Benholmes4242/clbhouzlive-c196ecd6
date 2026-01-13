import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const FriendsCoursesSkeleton: React.FC = () => {
  return (
    <div className="w-full animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-3">
        <Skeleton className="h-6 w-32 mb-1" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mt-6 rounded-xl overflow-hidden bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] px-4 py-5">
        <div className="grid grid-cols-2 gap-y-4">
          {/* Row 1 */}
          <div className="text-center relative">
            <Skeleton className="h-3 w-20 mx-auto mb-2" />
            <Skeleton className="h-6 w-8 mx-auto" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200/60" />
          </div>
          <div className="text-center">
            <Skeleton className="h-3 w-14 mx-auto mb-2" />
            <Skeleton className="h-6 w-6 mx-auto" />
          </div>

          {/* Horizontal divider */}
          <div className="col-span-2 h-px bg-slate-200/60 my-1" />

          {/* Row 2 */}
          <div className="text-center relative">
            <Skeleton className="h-3 w-16 mx-auto mb-2" />
            <Skeleton className="h-6 w-10 mx-auto" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200/60" />
          </div>
          <div className="text-center">
            <Skeleton className="h-3 w-20 mx-auto mb-2" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        </div>
        <Skeleton className="h-3 w-48 mx-auto mt-4" />
      </div>

      {/* Hero course card skeleton */}
      <div className="mt-6 w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
        <div className="rounded-none sm:rounded-xl overflow-hidden bg-card border border-border/60 shadow-md">
          <Skeleton className="w-full aspect-[1.77/1]" />
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex -space-x-2">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends activity leaderboard skeleton */}
      <div className="mt-6 rounded-xl bg-card border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="border-t border-border/60">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-4 py-2.5 flex items-center justify-between border-b last:border-b-0 border-border/40"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Trending section skeleton */}
      <div className="mt-6 rounded-xl bg-card border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`px-4 py-3.5 flex items-center gap-3 ${i !== 3 ? 'border-b border-border/40' : ''}`}
          >
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Activity summary skeleton */}
      <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div>
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-center gap-8 border-b border-border/40">
          <div className="text-center">
            <Skeleton className="h-5 w-8 mx-auto mb-1" />
            <Skeleton className="h-2 w-12 mx-auto" />
          </div>
          <div className="h-6 w-px bg-slate-200/60" />
          <div className="text-center">
            <Skeleton className="h-5 w-6 mx-auto mb-1" />
            <Skeleton className="h-2 w-14 mx-auto" />
          </div>
        </div>
        <div className="px-4 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Network activity feed skeleton */}
      <div className="mt-6">
        <div className="mb-3">
          <Skeleton className="h-5 w-32" />
        </div>
        
        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-12 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>

        {/* Feed items */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card/60 border border-border/50 rounded-xl p-3.5"
            >
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-56 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
              </div>
              <div className="mt-3 pt-3 border-t border-border/40">
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsCoursesSkeleton;
