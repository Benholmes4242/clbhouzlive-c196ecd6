/**
 * AchievementsSkeleton
 * Skeleton loader matching the Achievements page layout:
 * - Header with back button
 * - Hero progress card
 * - Badge grids for milestones and lists
 */

import { Skeleton } from "@/components/ui/skeleton";

export function AchievementsSkeleton() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      {/* Page header skeleton */}
      <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/[0.04]">
        {/* Back link skeleton */}
        <Skeleton className="h-5 w-28 mb-2" />
        {/* Title skeleton */}
        <div className="text-center mt-2">
          <Skeleton className="h-6 w-56 mx-auto" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Hero banner skeleton */}
        <section className="px-2.5 md:px-5 mt-5 mb-6">
          <div className="rounded-sq-lg p-5 md:p-6 bg-muted/50">
            <div className="flex flex-col gap-2.5">
              {/* Label */}
              <Skeleton className="h-3 w-40" />
              {/* Title + emblem row */}
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-7 w-20 rounded-sq-pill" />
              </div>
              {/* Progress line */}
              <Skeleton className="h-4 w-64" />
              {/* Trophy line */}
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </section>

        {/* Milestone badges grid skeleton */}
        <section className="px-2.5 md:px-5 pb-6">
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-sq-md p-4 bg-muted/40">
                <Skeleton className="h-10 w-10 rounded-full mb-3 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </section>

        {/* List completion badges grid skeleton */}
        <section className="px-2.5 md:px-5 pb-10">
          <Skeleton className="h-4 w-48 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-sq-md p-4 bg-muted/40">
                <Skeleton className="h-10 w-10 rounded-full mb-3 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AchievementsSkeleton;
