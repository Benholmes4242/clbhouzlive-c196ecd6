/**
 * HubSkeleton
 * Minimal skeleton that renders Hub chrome instantly while content loads
 */

import { Skeleton } from "@/components/ui/skeleton"

export function HubSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Glass Sheet - matches Hub structure */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
        }}
      >
        {/* Grabber bar */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 'calc(8px + env(safe-area-inset-top, 0px))',
            width: 36,
            height: 5,
            background: 'rgba(255, 255, 255, 0.25)',
          }}
        />

        {/* Content skeleton */}
        <main className="w-full overflow-y-auto h-screen pt-[env(safe-area-inset-top,0px)] px-3.5">
          <div className="pt-6 space-y-3.5">
            {/* Hero tile skeleton - matches 165px height */}
            <Skeleton 
              className="w-full rounded-[26px] bg-white/8" 
              style={{ height: '165px' }}
            />
            
            {/* Secondary tile skeleton */}
            <Skeleton 
              className="w-full rounded-sq-md bg-white/8" 
              style={{ height: '200px' }}
            />
            
            {/* Grid of square tiles */}
            <div className="grid grid-cols-2 gap-3.5">
              <Skeleton className="w-full rounded-sq-md bg-white/8" style={{ aspectRatio: '1' }} />
              <Skeleton className="w-full rounded-sq-md bg-white/8" style={{ aspectRatio: '1' }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
