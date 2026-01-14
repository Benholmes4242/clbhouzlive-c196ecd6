/**
 * HubSkeleton
 * Minimal skeleton matching HubHomePage standard page layout
 */

import { Skeleton } from "@/components/ui/skeleton"
import { PageRoot } from "@/components/layout/PageRoot"

export function HubSkeleton() {
  return (
    <PageRoot 
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--hub-bg-start, #EEF3F8)',
      }}
    >
      {/* Content skeleton - matches HubHomePage structure */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
          paddingBottom: 'calc(55px + 10px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="px-5 flex flex-col gap-[8px] flex-1 min-h-0">
          {/* Header skeleton - greeting + icon */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <Skeleton 
              className="h-8 rounded-full"
              style={{ 
                width: '60%',
                background: 'rgba(0, 0, 0, 0.06)',
              }}
            />
            <Skeleton 
              className="h-10 w-10 rounded-full"
              style={{ background: 'rgba(0, 0, 0, 0.06)' }}
            />
          </div>

          {/* Hero tile skeleton - matches 165px height */}
          <Skeleton 
            className="w-full rounded-[22px]" 
            style={{ 
              height: '165px',
              background: 'rgba(0, 0, 0, 0.04)',
            }}
          />

          {/* Messages card skeleton */}
          <div 
            className="rounded-[22px] p-4"
            style={{ 
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <Skeleton 
                className="h-10 w-10 rounded-full flex-shrink-0"
                style={{ background: 'rgba(0, 0, 0, 0.06)' }}
              />
              <div className="flex-1 space-y-2">
                <Skeleton 
                  className="h-5 w-24 rounded-full"
                  style={{ background: 'rgba(0, 0, 0, 0.06)' }}
                />
                <Skeleton 
                  className="h-3 w-full rounded-full"
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                />
              </div>
            </div>
          </div>

          {/* Two-card grid skeleton */}
          <div className="grid grid-cols-2 gap-[8px]">
            <Skeleton 
              className="rounded-[22px]" 
              style={{ 
                height: '130px',
                background: 'rgba(0, 0, 0, 0.04)',
              }}
            />
            <Skeleton 
              className="rounded-[22px]" 
              style={{ 
                height: '130px',
                background: 'rgba(0, 0, 0, 0.04)',
              }}
            />
          </div>

          {/* Your Games CTA skeleton */}
          <div className="flex-1 min-h-0 pb-[10px]">
            <Skeleton 
              className="h-full rounded-[22px]" 
              style={{ 
                minHeight: '80px',
                background: 'rgba(0, 0, 0, 0.03)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Dock skeleton - at bottom */}
      <div 
        className="sticky bottom-0 left-0 right-0 z-[10000] w-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div 
          className="relative w-full h-[55px] flex items-center justify-around"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 py-1">
              <Skeleton 
                className="h-[26px] w-[26px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
              <Skeleton 
                className="h-[10px] w-8 rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.06)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </PageRoot>
  )
}
