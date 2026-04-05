import { Skeleton } from '@/components/ui/skeleton';

interface LoopCardSkeletonProps {
  variant?: 'landscape' | 'portrait';
}

export function LoopCardSkeleton({ variant = 'landscape' }: LoopCardSkeletonProps) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border border-border/30">
      {/* Creator header — squircle avatar */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <Skeleton className="h-9 w-9 shrink-0" style={{ borderRadius: '28%' }} />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      {/* Caption */}
      <div className="px-3 pb-2 space-y-1.5">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
      {/* Media area */}
      <div className="relative">
        <Skeleton className={`w-full ${variant === 'portrait' ? 'aspect-[4/5]' : 'aspect-video'}`} />
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2">
          <Skeleton className="h-[18px] w-[38px] rounded-md" />
        </div>
      </div>
      {/* Course DNA / location row */}
      <div className="px-3 pt-2 pb-1.5">
        <Skeleton className="h-3.5 w-40 rounded" />
      </div>
      {/* Engagement row */}
      <div className="flex items-center gap-5 px-3 pt-1.5 pb-2.5">
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-7 w-[110px] rounded-lg ml-auto" />
      </div>
    </div>
  );
}
