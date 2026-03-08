import { Skeleton } from '@/components/ui/skeleton';

export function VideoCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border-b border-border/50">
      {/* Creator header */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {/* Video area */}
      <Skeleton className="aspect-[16/9.5] w-full" />
      {/* Caption */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      {/* Engagement row */}
      <div className="flex items-center gap-6 px-3 pb-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
