import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const FriendsCoursesSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      {/* Filters row – same width as tabs content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 space-y-4">
        {/* Timeframe + course filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 rounded-xl w-full sm:w-40" />
          <Skeleton className="h-11 rounded-xl w-full sm:w-40" />
          <Skeleton className="h-11 rounded-xl w-full sm:w-40 hidden sm:block" />
        </div>

        {/* Snapshot card */}
        <div className="rounded-3xl bg-card shadow-sm border border-border px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero + leaderboard + main list use the SAME container width as real content */}
      <div className="max-w-4xl mx-auto px-0 sm:px-0 lg:px-0 mt-6 space-y-6">
        {/* Hero course card skeleton */}
        <div className="rounded-none sm:rounded-xl overflow-hidden bg-card shadow-sm border border-border">
          <Skeleton className="w-full aspect-[1.7/1]" />
          <div className="px-5 py-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Friends activity leaderboard skeleton */}
        <div className="rounded-3xl bg-card shadow-sm border border-border">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-5 py-3 flex items-center justify-between border-t border-border/40"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
          ))}
        </div>

        {/* Main course cards skeleton (2–3 cards) */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-none sm:rounded-xl overflow-hidden bg-card shadow-sm border border-border"
          >
            <Skeleton className="w-full aspect-[1.7/1]" />
            <div className="px-5 py-4 space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}

        {/* Recent rounds skeleton header + list */}
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>

          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-t border-border/40"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsCoursesSkeleton;
