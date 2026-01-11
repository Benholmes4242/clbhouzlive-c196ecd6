import { Skeleton } from "@/components/ui/skeleton"

export const DiscoverSkeleton = () => {
  return (
    <div className="min-h-screen page-with-header pb-20 bg-background">
      {/* Top tabs/segmented control */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Hero skeleton */}
      <div className="mx-4 h-[220px] rounded-2xl bg-muted animate-pulse" />

      {/* Journey card skeleton */}
      <div className="mx-4 mt-6 h-[160px] rounded-2xl bg-muted/50 animate-pulse" />

      {/* Region cards skeleton */}
      <div className="mt-6 px-4 mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="flex gap-3 px-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[200px] h-[140px] flex-shrink-0 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>

      {/* Carousel skeleton */}
      <div className="mt-6 px-4 mb-3">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex gap-3 px-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[120px] aspect-[3/4] flex-shrink-0 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="mt-8 px-4 mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-1 px-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
