import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export const DiscoverSkeleton = () => {
  return (
    <div className="min-h-screen bg-background page-with-header pb-20">
      {/* Search bar */}
      <div className="px-4 pt-4">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
