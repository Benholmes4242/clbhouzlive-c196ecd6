import { Skeleton } from '@/components/ui/skeleton';

interface LoopCardSkeletonProps {
  variant?: 'landscape' | 'portrait';
}

export function LoopCardSkeleton({ variant = 'landscape' }: LoopCardSkeletonProps) {
  return (
    <div className="bg-card overflow-hidden border-b border-border/50">
      {/* Media */}
      <Skeleton className={`w-full ${variant === 'portrait' ? 'aspect-[4/5]' : 'aspect-video'}`} />
      {/* Creator row */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-0">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-2.5 w-24 mt-0.5" />
        </div>
      </div>
      {/* Caption */}
      <div className="px-3 pt-1.5 pb-0 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      {/* Engagement row */}
      <div className="flex items-center gap-5 px-3 pt-2 pb-2.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}
