/**
 * LongFormFeedCardSkeleton - Loading skeleton for LongFormFeedCard
 * 
 * TikTok-Level: Staggered shimmer animations with reduced-motion support
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LongFormFeedCardSkeletonProps {
  /** Index for staggered animation delay */
  index?: number;
}

export function LongFormFeedCardSkeleton({ index = 0 }: LongFormFeedCardSkeletonProps) {
  // Stagger delay: 50ms per item, max 200ms
  const staggerDelay = Math.min(index * 50, 200);
  
  return (
    <div 
      className={cn(
        "bg-white overflow-hidden border-x border-border/40",
        "motion-safe:animate-shimmer-down"
      )}
      style={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        animationDelay: `${staggerDelay}ms`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3" style={{ padding: '12px 16px 8px 16px' }}>
        <Skeleton 
          className="w-10 h-10 flex-shrink-0 motion-safe:animate-shimmer-down" 
          style={{ borderRadius: '34%', animationDelay: `${staggerDelay + 50}ms` }} 
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton 
            className="h-4 w-28 rounded motion-safe:animate-shimmer-down" 
            style={{ animationDelay: `${staggerDelay + 100}ms` }}
          />
          <Skeleton 
            className="h-3 w-36 rounded motion-safe:animate-shimmer-down" 
            style={{ animationDelay: `${staggerDelay + 150}ms` }}
          />
        </div>
        <Skeleton 
          className="w-8 h-8 rounded-full flex-shrink-0 motion-safe:animate-shimmer-down" 
          style={{ animationDelay: `${staggerDelay + 100}ms` }}
        />
      </div>

      {/* Caption */}
      <div style={{ padding: '0 16px 10px 16px' }} className="space-y-1.5">
        <Skeleton 
          className="h-4 w-full rounded motion-safe:animate-shimmer-down" 
          style={{ animationDelay: `${staggerDelay + 150}ms` }}
        />
        <Skeleton 
          className="h-4 w-3/4 rounded motion-safe:animate-shimmer-down" 
          style={{ animationDelay: `${staggerDelay + 200}ms` }}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Media - uses larger delay for visual rhythm */}
      <Skeleton 
        className="w-full aspect-video motion-safe:animate-shimmer-down" 
        style={{ animationDelay: `${staggerDelay + 100}ms` }}
      />

      {/* Social proof */}
      <div className="px-4 py-2 border-b border-border/30">
        <Skeleton 
          className="h-3 w-32 rounded motion-safe:animate-shimmer-down" 
          style={{ animationDelay: `${staggerDelay + 250}ms` }}
        />
      </div>

      {/* Actions */}
      <div className="flex py-1 border-t border-border/30">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 py-2 flex flex-col items-center gap-0.5">
            <Skeleton 
              className="h-5 w-5 rounded motion-safe:animate-shimmer-down" 
              style={{ animationDelay: `${staggerDelay + 250 + i * 30}ms` }}
            />
            <Skeleton 
              className="h-3 w-8 rounded motion-safe:animate-shimmer-down" 
              style={{ animationDelay: `${staggerDelay + 280 + i * 30}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LongFormFeedCardSkeleton;
