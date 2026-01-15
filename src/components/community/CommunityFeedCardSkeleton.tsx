/**
 * CommunityFeedCardSkeleton - Loading skeleton for CommunityFeedCard
 * Matches the exact layout structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function CommunityFeedCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden border-x border-border/40">
      {/* Header skeleton */}
      <div className="flex items-start gap-3 p-4">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Caption skeleton */}
      <div className="px-4 pb-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Media skeleton - alternate between portrait and landscape */}
      <Skeleton className="w-full aspect-[4/5]" />

      {/* Social proof skeleton */}
      <div className="px-4 py-2">
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Action bar skeleton */}
      <div className="flex border-t border-border/30">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityFeedCardSkeleton;
