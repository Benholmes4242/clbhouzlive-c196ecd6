import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function HeroSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-surface-card border border-border-subtle rounded-sq-lg p-6", className)}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 clb-skeleton rounded-sq-sm" />
            <div className="h-6 w-16 clb-skeleton rounded-sq-pill" />
          </div>
          <div className="h-7 w-3/4 clb-skeleton rounded-sq-sm" />
          <div className="h-5 w-1/2 clb-skeleton rounded-sq-sm" />
          <div className="h-4 w-1/3 clb-skeleton rounded-sq-sm" />
        </div>
        <div className="w-full md:w-80">
          <LeaderboardSkeleton rows={5} />
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-surface-card border border-border-subtle rounded-sq-lg p-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-16 clb-skeleton rounded-sq-sm" />
        <div className="h-5 w-20 clb-skeleton rounded-sq-pill" />
      </div>
      <div className="h-5 w-3/4 clb-skeleton rounded-sq-sm mb-2" />
      <div className="h-4 w-1/2 clb-skeleton rounded-sq-sm mb-1" />
      <div className="h-4 w-1/3 clb-skeleton rounded-sq-sm" />
    </div>
  );
}

export function LeaderboardSkeleton({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("bg-surface-alt border border-border-subtle rounded-sq-md overflow-hidden", className)}>
      <div className="grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2 border-b border-border-subtle">
        <div className="h-3 w-8 clb-skeleton rounded-sq-sm" />
        <div className="h-3 w-12 clb-skeleton rounded-sq-sm" />
        <div className="h-3 w-10 clb-skeleton rounded-sq-sm ml-auto" />
        <div className="h-3 w-8 clb-skeleton rounded-sq-sm ml-auto" />
        <div className="h-3 w-8 clb-skeleton rounded-sq-sm ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            "grid grid-cols-[40px_1fr_60px_50px_50px] gap-2 px-3 py-2.5",
            i % 2 === 0 ? "bg-surface-card" : "bg-surface-alt"
          )}
        >
          <div className="h-4 w-6 clb-skeleton rounded-sq-sm" />
          <div className="h-4 w-24 clb-skeleton rounded-sq-sm" />
          <div className="h-4 w-8 clb-skeleton rounded-sq-sm ml-auto" />
          <div className="h-4 w-6 clb-skeleton rounded-sq-sm ml-auto" />
          <div className="h-4 w-6 clb-skeleton rounded-sq-sm ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SectionHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("h-6 w-32 clb-skeleton rounded-sq-sm", className)} />
  );
}

export function PageHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-8 w-48 clb-skeleton rounded-sq-sm" />
      <div className="h-5 w-72 clb-skeleton rounded-sq-sm" />
    </div>
  );
}
