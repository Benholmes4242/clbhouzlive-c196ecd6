import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export const TourSkeleton = () => {
  return (
    <div className="min-h-screen bg-background page-with-header pb-20">
      {/* Hero */}
      <div className="px-4 pt-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-card rounded-2xl p-4 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="space-y-4 px-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard 
            key={i}
            showAvatar
            titleLines={1}
            contentLines={2}
          />
        ))}
      </div>
    </div>
  )
}
