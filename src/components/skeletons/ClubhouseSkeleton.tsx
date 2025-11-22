/**
 * Phase 1 Perf: Skeleton loader for Clubhouse feed
 * Shows layout structure immediately while data loads
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar } from "@/components/ui/skeleton-avatar"
import { SkeletonText } from "@/components/ui/skeleton-text"

export const ClubhouseSkeleton = () => {
  return (
    <div className="w-full h-screen bg-background">
      {/* Simulated video card skeleton */}
      <div className="relative w-full h-full">
        <Skeleton className="absolute inset-0 bg-white/8" />
        
        {/* Bottom HUD skeleton */}
        <div className="absolute bottom-24 left-3 z-10">
          <div className="glass-dark rounded-2xl px-4 py-3 w-[280px] space-y-2">
            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <SkeletonAvatar size="md" className="bg-white/10" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
            {/* Caption lines */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-full bg-white/10" />
              <Skeleton className="h-3 w-3/4 bg-white/10" />
            </div>
            {/* Course pill */}
            <Skeleton className="h-6 w-40 rounded-full bg-white/10" />
          </div>
        </div>
        
        {/* Right rail skeleton */}
        <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="glass-dark w-[40px] h-[40px] rounded-full">
                <Skeleton className="w-full h-full rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-2 w-8 bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
