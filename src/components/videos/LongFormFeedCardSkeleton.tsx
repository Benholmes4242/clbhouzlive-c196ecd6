/**
 * LongFormFeedCardSkeleton - Loading skeleton for LongFormFeedCard
 * 
 * Watch Tab Standard:
 * - bg-gray-200 base color
 * - Left-to-right shimmer sweep (via-white/40)
 * - Staggered animations with reduced-motion support
 */

import { cn } from '@/lib/utils';

interface LongFormFeedCardSkeletonProps {
  /** Index for staggered animation delay */
  index?: number;
}

// Shimmer component - Watch tab standard left-to-right sweep
function Shimmer({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={cn("bg-gray-200 overflow-hidden", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div 
        className="h-full w-full -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent motion-reduce:animate-none"
        style={{ animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

export function LongFormFeedCardSkeleton({ index = 0 }: LongFormFeedCardSkeletonProps) {
  // Stagger delay: 50ms per item, max 200ms
  const staggerDelay = Math.min(index * 50, 200);
  
  return (
    <div 
      className="bg-white overflow-hidden border-x border-border/40"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3" style={{ padding: '12px 16px 8px 16px' }}>
        <Shimmer 
          className="w-10 h-10 flex-shrink-0" 
          delay={staggerDelay + 50}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Shimmer 
            className="h-4 w-28 rounded" 
            delay={staggerDelay + 100}
          />
          <Shimmer 
            className="h-3 w-36 rounded" 
            delay={staggerDelay + 150}
          />
        </div>
        <Shimmer 
          className="w-8 h-8 rounded-full flex-shrink-0" 
          delay={staggerDelay + 100}
        />
      </div>

      {/* Caption */}
      <div style={{ padding: '0 16px 10px 16px' }} className="space-y-1.5">
        <Shimmer 
          className="h-4 w-full rounded" 
          delay={staggerDelay + 150}
        />
        <Shimmer 
          className="h-4 w-3/4 rounded" 
          delay={staggerDelay + 200}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Media - uses larger delay for visual rhythm */}
      <Shimmer 
        className="w-full aspect-video" 
        delay={staggerDelay + 100}
      />

      {/* Social proof */}
      <div className="px-4 py-2 border-b border-border/30">
        <Shimmer 
          className="h-3 w-32 rounded" 
          delay={staggerDelay + 250}
        />
      </div>

      {/* Actions */}
      <div className="flex py-1 border-t border-border/30">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 py-2 flex flex-col items-center gap-0.5">
            <Shimmer 
              className="h-5 w-5 rounded" 
              delay={staggerDelay + 250 + i * 30}
            />
            <Shimmer 
              className="h-3 w-8 rounded" 
              delay={staggerDelay + 280 + i * 30}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LongFormFeedCardSkeleton;
