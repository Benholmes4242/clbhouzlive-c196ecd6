import React from 'react';
import { cn } from '@/lib/utils';

interface VideoTileSkeletonProps {
  variant?: 'portrait' | 'landscape';
  className?: string;
}

/**
 * VideoTileSkeleton - A polished skeleton shown INSTEAD of spinner
 * 
 * Used in the Skeleton-Until-Ready pattern:
 * - Show skeleton until video is fully prefetched
 * - Reveal actual video only when it can play instantly
 * - Never show loading spinners to users
 */
const VideoTileSkeleton: React.FC<VideoTileSkeletonProps> = ({
  variant = 'portrait',
  className,
}) => {
  const aspectClass = variant === 'landscape' ? 'aspect-[16/9]' : 'aspect-[3/4]';
  
  return (
    <div 
      className={cn(
        aspectClass,
        "relative overflow-hidden bg-muted/30 rounded-md",
        variant === 'landscape' && "col-span-2",
        className
      )}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 animate-pulse">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          style={{
            animation: 'shimmer 2s infinite',
            transform: 'translateX(-100%)',
          }}
        />
      </div>
      
      {/* Subtle gradient to match video tile aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      
      {/* Placeholder for bottom overlay area */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5">
        <div className="h-2.5 w-2/3 bg-white/10 rounded-full" />
        <div className="h-2 w-1/3 bg-white/5 rounded-full" />
      </div>
    </div>
  );
};

export default React.memo(VideoTileSkeleton);
