/**
 * HubSkeleton
 * Standard page skeleton for Hub - matches page-based architecture
 * Uses same styling as other page skeletons (CoursesListSkeleton, GenericPageSkeleton)
 */

import { Skeleton } from "@/components/ui/skeleton"

function SkeletonBar({ width, height = 'h-4' }: { width: string; height?: string }) {
  return (
    <Skeleton className={`${width} ${height} rounded-full`} />
  );
}

function SkeletonCircle({ size }: { size: string }) {
  return (
    <Skeleton className={`${size} rounded-full`} />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <Skeleton className={`rounded-[22px] ${className || ''}`} />
  );
}

export function HubSkeleton() {
  return (
    <div className="min-h-screen bg-background page-with-header">
      {/* Main content area */}
      <main 
        className="px-5 flex flex-col gap-[8px]"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header skeleton - greeting + icon */}
        <div className="flex items-center justify-between py-2">
          <SkeletonBar width="w-[60%]" height="h-8" />
          <SkeletonCircle size="h-10 w-10" />
        </div>

        {/* Hero tile skeleton - matches 165px height */}
        <SkeletonBlock className="h-[165px] w-full" />

        {/* Messages card skeleton */}
        <div className="rounded-[22px] p-4 bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <SkeletonCircle size="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <SkeletonBar width="w-24" height="h-5" />
              <SkeletonBar width="w-full" height="h-3" />
            </div>
          </div>
        </div>

        {/* Two-card grid skeleton */}
        <div className="grid grid-cols-2 gap-[8px]">
          <SkeletonBlock className="h-[130px]" />
          <SkeletonBlock className="h-[130px]" />
        </div>

        {/* Your Games card skeleton */}
        <div className="rounded-[22px] p-4 bg-muted/30 border border-border/50">
          <div className="flex items-center gap-4">
            <SkeletonCircle size="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <SkeletonBar width="w-28" height="h-5" />
              <SkeletonBar width="w-full" height="h-3" />
            </div>
          </div>
        </div>

        {/* Additional content skeleton */}
        <SkeletonBlock className="h-[100px] w-full" />
      </main>
    </div>
  )
}
