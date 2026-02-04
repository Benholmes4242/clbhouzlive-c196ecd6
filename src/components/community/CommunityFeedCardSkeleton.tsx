/**
 * CommunityFeedCardSkeleton - TikTok-Level Loading Skeleton
 * - Shimmer-down animation
 * - Staggered animation delays
 * - Reduced motion support
 */

import { cn } from '@/lib/utils';

interface CommunityFeedCardSkeletonProps {
  index?: number;
}

export function CommunityFeedCardSkeleton({ index = 0 }: CommunityFeedCardSkeletonProps) {
  // Base delay for staggered effect
  const baseDelay = index * 100;
  
  return (
    <div className="bg-card overflow-hidden border-x border-border/40">
      {/* Header skeleton */}
      <div className="flex items-start gap-3 p-4">
        <div 
          className="w-10 h-10 rounded-xl flex-shrink-0 bg-muted motion-safe:animate-shimmer-down"
          style={{ animationDelay: `${baseDelay}ms` }}
        />
        <div className="flex-1 space-y-1.5">
          <div 
            className="h-4 w-28 rounded bg-muted motion-safe:animate-shimmer-down"
            style={{ animationDelay: `${baseDelay + 50}ms` }}
          />
          <div 
            className="h-3 w-36 rounded bg-muted motion-safe:animate-shimmer-down"
            style={{ animationDelay: `${baseDelay + 100}ms` }}
          />
        </div>
        <div 
          className="w-8 h-8 rounded-full bg-muted motion-safe:animate-shimmer-down"
          style={{ animationDelay: `${baseDelay + 150}ms` }}
        />
      </div>

      {/* Caption skeleton */}
      <div className="px-4 pb-2 space-y-2">
        <div 
          className="h-4 w-full rounded bg-muted motion-safe:animate-shimmer-down"
          style={{ animationDelay: `${baseDelay + 200}ms` }}
        />
        <div 
          className="h-4 w-3/4 rounded bg-muted motion-safe:animate-shimmer-down"
          style={{ animationDelay: `${baseDelay + 250}ms` }}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Media skeleton - alternate between portrait and landscape */}
      <div 
        className={cn(
          "w-full bg-muted motion-safe:animate-shimmer-down",
          index % 2 === 0 ? "aspect-[4/5]" : "aspect-video"
        )}
        style={{ animationDelay: `${baseDelay + 300}ms` }}
      />

      {/* Social proof skeleton */}
      <div className="px-4 py-2">
        <div 
          className="h-3 w-24 rounded bg-muted motion-safe:animate-shimmer-down"
          style={{ animationDelay: `${baseDelay + 350}ms` }}
        />
      </div>

      {/* Action bar skeleton */}
      <div className="flex border-t border-border/30">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <div 
              className="h-5 w-12 rounded bg-muted motion-safe:animate-shimmer-down"
              style={{ animationDelay: `${baseDelay + 350 + (i * 50)}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityFeedCardSkeleton;
