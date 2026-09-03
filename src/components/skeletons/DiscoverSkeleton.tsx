import { Skeleton } from "@/components/ui/skeleton"
import { A } from '@/features/courses/components/holes/analytical/tokens'

export const DiscoverSkeleton = () => {
  return (
    <div className="min-h-screen page-with-header pb-20" style={{ background: A.CANVAS }}>
      {/* Top tabs — 3 soft-squircle pills matching SegmentedControl */}
      <div className="flex" style={{ gap: 8, padding: '8px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <Skeleton className="h-8 w-[72px] rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <Skeleton className="h-8 w-[78px] rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <Skeleton className="h-8 w-[70px] rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Sub-tabs — Clips/Videos pills */}
      <div className="flex justify-center gap-2 py-2.5 px-4">
        <Skeleton className="h-[38px] w-[80px] rounded-lg" />
        <Skeleton className="h-[38px] w-[80px] rounded-lg" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-2 overflow-hidden">
        {[48, 64, 72, 56].map((w, i) => (
          <Skeleton key={i} className="h-[32px] shrink-0 rounded-full" style={{ width: w }} />
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
