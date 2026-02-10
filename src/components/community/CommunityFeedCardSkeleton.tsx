/**
 * CommunityFeedCardSkeleton - Matches actual CommunityFeedCard styling
 * Fix 9: rounded-2xl mx-4 shadow-sm border border-gray-100 bg-white
 * - Left-to-right shimmer sweep (via-white/40)
 * - Staggered animation delays
 * - Reduced motion support
 */

import { cn } from '@/lib/utils';

interface CommunityFeedCardSkeletonProps {
  index?: number;
}

// Shimmer component
function Shimmer({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={cn("bg-gray-200 overflow-hidden", className)}
    >
      <div 
        className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animationDelay: `${delay}ms` }}
      />
    </div>
  );
}

export function CommunityFeedCardSkeleton({ index = 0 }: CommunityFeedCardSkeletonProps) {
  const baseDelay = index * 100;
  
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm mx-4">
      {/* Header skeleton */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <Shimmer 
          className="w-10 h-10 rounded-xl flex-shrink-0"
          delay={baseDelay}
        />
        <div className="flex-1 space-y-1.5">
          <Shimmer 
            className="h-4 w-28 rounded"
            delay={baseDelay + 50}
          />
          <Shimmer 
            className="h-3 w-36 rounded"
            delay={baseDelay + 100}
          />
        </div>
        <Shimmer 
          className="w-8 h-8 rounded-full"
          delay={baseDelay + 150}
        />
      </div>

      {/* Caption skeleton */}
      <div className="px-4 py-2 space-y-2">
        <Shimmer 
          className="h-4 w-full rounded"
          delay={baseDelay + 200}
        />
        <Shimmer 
          className="h-4 w-3/4 rounded"
          delay={baseDelay + 250}
        />
      </div>

      {/* Media skeleton — alternate between portrait and landscape */}
      <Shimmer 
        className={cn(
          "w-full",
          index % 2 === 0 ? "aspect-[4/5]" : "aspect-video"
        )}
        delay={baseDelay + 300}
      />

      {/* Social proof skeleton */}
      <div className="px-4 py-2">
        <Shimmer 
          className="h-3 w-24 rounded"
          delay={baseDelay + 350}
        />
      </div>

      {/* Action bar skeleton */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 py-2 flex justify-center">
              <Shimmer 
                className="h-5 w-12 rounded"
                delay={baseDelay + 350 + (i * 50)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommunityFeedCardSkeleton;
