/**
 * Phase 1 Perf: Skeleton loader for Clubhouse feed
 * Shows layout structure immediately while data loads
 */

import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonAvatar } from "@/components/ui/skeleton-avatar"
import { SkeletonText } from "@/components/ui/skeleton-text"

export const ClubhouseSkeleton = () => {
  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      {/* Simulated video card skeleton */}
      <div className="relative w-full h-full">
        <Skeleton className="absolute inset-0 bg-white/8" />
        
        {/* Bottom HUD skeleton - matches AppleMetadataCapsule */}
        <div className="absolute bottom-24 left-3 z-10">
          <div className="glass-dark rounded-2xl px-4 py-3 min-w-[240px] max-w-[300px] space-y-0.5">
            {/* Avatar + name - matching exact size and gap */}
            <div className="flex items-center gap-2">
              <SkeletonAvatar size="lg" className="bg-white/10" />
              <div className="flex-1 space-y-0.5">
                <Skeleton className="h-4 w-32 bg-white/10 rounded-lg" />
                <Skeleton className="h-3 w-24 bg-white/10 rounded-lg" />
              </div>
            </div>
            {/* Caption lines */}
            <div className="space-y-1 pt-1">
              <Skeleton className="h-3 w-full bg-white/10 rounded-lg" />
              <Skeleton className="h-3 w-3/4 bg-white/10 rounded-lg" />
            </div>
            {/* Course pill */}
            <div className="pt-1">
              <Skeleton className="h-6 w-40 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
        
        {/* Right rail skeleton - matching exact button size and spacing */}
        <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="glass-dark w-[50px] h-[50px] rounded-full flex items-center justify-center">
                <Skeleton className="w-6 h-6 bg-white/10 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-8 bg-white/20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
