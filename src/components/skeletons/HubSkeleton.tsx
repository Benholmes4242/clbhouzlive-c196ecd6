/**
 * HubSkeleton
 * Dark-themed skeleton for Hub pages
 */

import { Skeleton } from "@/components/ui/skeleton"

export function HubSkeleton() {
  return (
    <div className="fixed inset-0 z-[10000] bg-[#16181B] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
        <Skeleton className="h-4 w-16 bg-white/8" />
        <Skeleton className="h-5 w-32 bg-white/8" />
        <Skeleton className="h-4 w-16 bg-white/8" />
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Hero tile */}
        <Skeleton className="h-32 w-full rounded-2xl bg-white/8" />
        
        {/* Grid of tiles */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/8" />
          ))}
        </div>
      </div>
    </div>
  )
}
