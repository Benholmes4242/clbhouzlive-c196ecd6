import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreGridSkeleton() {
  return (
    <div className="space-y-0">
      {/* Hero carousel skeleton */}
      <div>
        <Skeleton className="w-full h-[260px] sm:h-[290px]" />
      </div>

      {/* Region chips row */}
      <div className="flex gap-2 px-4 py-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[32px] shrink-0 rounded-full"
            style={{ width: i === 0 ? 48 : i === 1 ? 56 : 72 }}
          />
        ))}
      </div>

      {/* Echo CTA placeholder */}
      <div className="px-3 pb-2">
        <Skeleton className="h-[52px] w-full rounded-xl" />
      </div>

      {/* Horizontal strip — Highest rated */}
      <div className="px-4 pt-3 pb-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
        <Skeleton className="h-4 w-44 rounded" />
      </div>
      <div className="flex gap-2 px-3 pb-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shrink-0" style={{ width: 150 }}>
            <Skeleton className="w-full h-[120px] rounded-xl" />
            <div className="pt-2 space-y-1.5">
              <Skeleton className="h-3 w-[120px] rounded" />
              <Skeleton className="h-2.5 w-[80px] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Most loved strip */}
      <div className="px-4 pt-3 pb-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <div className="flex gap-3 px-4 pb-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="shrink-0 w-[160px] aspect-[3/4] rounded-xl" />
        ))}
      </div>

      {/* Grid skeleton — 2 columns */}
      <div className="grid grid-cols-2 gap-[2px] px-[2px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-[4px]" />
        ))}
      </div>
    </div>
  );
}
