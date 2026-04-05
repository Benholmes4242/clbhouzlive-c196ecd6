import { Skeleton } from "@/components/ui/skeleton"

export const DiscoverSkeleton = () => {
  return (
    <div className="min-h-screen page-with-header pb-20 bg-background">
      {/* Top tabs — 3 underline-style tabs matching SegmentedControl */}
      <div className="flex justify-center gap-5 py-3 px-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      {/* Sub-tabs — Clips/Videos or filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-hidden">
        {[48, 64, 72, 56].map((w, i) => (
          <Skeleton key={i} className="h-[30px] shrink-0 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* 3-column grid (Watch clips default) */}
      <div className="grid grid-cols-3 gap-[2px] px-[2px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton className="aspect-[4/5] rounded-[4px]" />
            <div className="absolute bottom-1.5 right-1.5">
              <Skeleton className="h-[16px] w-[32px] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
