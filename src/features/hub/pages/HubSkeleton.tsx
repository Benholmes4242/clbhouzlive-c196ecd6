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
          background: 'var(--hub-bg-start, #EDEFF2)',
          border: '1px solid var(--hub-stroke-subtle, #E5E7EA)',
          boxShadow: 'var(--hub-shadow-main, 0 4px 24px rgba(31, 36, 40, 0.08))',
        }}
      >
        {/* Grabber bar */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 'calc(8px + env(safe-area-inset-top, 0px))',
            width: 36,
            height: 5,
            background: 'var(--hub-stroke, #D4D7DB)',
          }}
        />

        {/* Content skeleton */}
        <main className="w-full overflow-y-auto h-screen pt-[env(safe-area-inset-top,0px)] px-3.5">
          <div className="pt-6 space-y-3.5">
            {/* Hero tile skeleton */}
            <Skeleton 
              className="w-full rounded-sq-md" 
              style={{ 
                height: 'var(--hub-tile-fixed-h, 180px)',
                background: 'var(--hub-skeleton-base, #E8EAEC)',
              }}
            />
            
            {/* Secondary tile skeleton */}
            <Skeleton 
              className="w-full rounded-sq-md" 
              style={{ 
                height: '200px',
                background: 'var(--hub-skeleton-base, #E8EAEC)',
              }}
            />
            
            {/* Grid of square tiles */}
            <div className="grid grid-cols-2 gap-3.5">
              <Skeleton 
                className="w-full rounded-sq-md" 
                style={{ 
                  aspectRatio: '1',
                  background: 'var(--hub-skeleton-base, #E8EAEC)',
                }} 
              />
              <Skeleton 
                className="w-full rounded-sq-md" 
                style={{ 
                  aspectRatio: '1',
                  background: 'var(--hub-skeleton-base, #E8EAEC)',
                }} 
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
