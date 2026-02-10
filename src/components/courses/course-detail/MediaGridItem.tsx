import React, { memo, useState } from 'react';
import type { ExtendedMediaItem } from '@/components/media-grid';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

interface MediaGridItemProps {
  item: ExtendedMediaItem;
  onClick: (item: ExtendedMediaItem) => void;
  /** Show "+X" overlay for additional media count */
  overflowCount?: number;
  /** Index in the grid — first 4 tiles get eager loading + high fetch priority */
  index?: number;
}

/**
 * Memoized grid item with polish: skeleton, centered play icon, hover effects
 */
export const MediaGridItem = memo(function MediaGridItem({ item, onClick, overflowCount, index = 99 }: MediaGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const isVideo = item.type === 'video';
  const imageSrc = isVideo ? (item.posterUrl || item.url) : item.url;
  const isAboveTheFold = index < 4;
  
  // Format duration for display - returns null if no valid duration
  const formatDuration = (seconds?: number): string | null => {
    if (!seconds || Number.isNaN(seconds) || seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  const durationText = formatDuration(item.duration);

  return (
    <button
      onClick={() => onClick(item)}
      className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        "ring-1 ring-black/5",
        "hover:ring-black/10 transition-all duration-150",
        "active:scale-[0.98]"
      )}
    >
      {/* Skeleton placeholder - shows until image loads */}
      {!isLoaded && !isBroken && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Fix 1: Broken image fallback */}
      {isBroken && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Camera className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}

      {/* Lazy-loading image */}
      {!isBroken && (
        <img
          src={imageSrc}
          alt={item.alt || 'Media'}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={isAboveTheFold ? 'eager' : 'lazy'}
          fetchPriority={isAboveTheFold ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsBroken(true)}
        />
      )}

      {/* Video overlays - using same VideoPlayIndicator as explore/discover pages */}
      {isVideo && !isBroken && (
        <>
          {/* Play icon - bottom left, matching explore/discover pages */}
          <VideoPlayIndicator size="lg" />

          {/* Duration badge - bottom right, only show if valid duration */}
          {durationText && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm">
              <span className="text-xs text-white font-medium tabular-nums">
                {durationText}
              </span>
            </div>
          )}
        </>
      )}

      {/* "+X more" overlay - frosted glass style */}
      {overflowCount && overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <span className="text-xl font-semibold text-white">+{overflowCount}</span>
        </div>
      )}
    </button>
  );
});
