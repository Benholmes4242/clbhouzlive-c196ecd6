import { Skeleton } from '@/components/ui/skeleton';

interface LoopCardSkeletonProps {
  variant?: 'landscape' | 'portrait';
}

export function LoopCardSkeleton({ variant = 'landscape' }: LoopCardSkeletonProps) {
  return (
    <div className="bg-card overflow-hidden border-b border-border/50">
      {/* Creator header */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-36 mt-0.5" /> {/* "at Course Name" skeleton */}
        </div>
      </div>
      {/* Caption placeholder */}
      <div className="px-3 pb-2 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      {/* Media area */}
      <Skeleton className={`w-full ${variant === 'portrait' ? 'aspect-[4/5]' : 'aspect-video'}`} />
      {/* Engagement row */}
      <div className="flex items-center gap-6 px-3 py-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
