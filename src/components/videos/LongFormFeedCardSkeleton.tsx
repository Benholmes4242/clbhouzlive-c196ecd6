/**
 * LongFormFeedCardSkeleton - Loading skeleton for LongFormFeedCard
 * Matches the exact layout of the feed card
 */

import { Skeleton } from '@/components/ui/skeleton';

export function LongFormFeedCardSkeleton() {
  return (
    <div 
      className="bg-white overflow-hidden border-x border-border/40"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3" style={{ padding: '12px 16px 8px 16px' }}>
        <Skeleton className="w-10 h-10 flex-shrink-0" style={{ borderRadius: '34%' }} />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      </div>

      {/* Caption */}
      <div style={{ padding: '0 16px 10px 16px' }} className="space-y-1.5">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Media */}
      <Skeleton className="w-full aspect-video" />

      {/* Social proof */}
      <div className="px-4 py-2 border-b border-border/30">
        <Skeleton className="h-3 w-32 rounded" />
      </div>

      {/* Actions */}
      <div className="flex py-1 border-t border-border/30">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 py-2 flex flex-col items-center gap-0.5">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LongFormFeedCardSkeleton;
