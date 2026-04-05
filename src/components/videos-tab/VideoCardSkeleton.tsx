import { Skeleton } from '@/components/ui/skeleton';

export function VideoCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border-b border-border/50">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full" />
      {/* Creator row — squircle avatar */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
        <Skeleton className="h-8 w-8 shrink-0" style={{ borderRadius: '28%' }} />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
      </div>
      {/* Caption */}
      <div className="px-3 pb-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
      {/* Engagement row */}
      <div className="flex items-center gap-6 px-3 py-2">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}
