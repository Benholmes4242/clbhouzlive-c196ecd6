import React, { memo, useState } from 'react';
import type { ExtendedMediaItem } from '@/components/media-grid';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import { cn } from '@/lib/utils';

interface MediaGridItemProps {
  item: ExtendedMediaItem;
  onClick: (item: ExtendedMediaItem) => void;
  /** Show "+X" overlay for additional media count */
  overflowCount?: number;
}

/**
 * Memoized grid item with polish: skeleton, centered play icon, hover effects
 */
export const MediaGridItem = memo(function MediaGridItem({ item, onClick, overflowCount }: MediaGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = item.type === 'video';
  const imageSrc = isVideo ? (item.posterUrl || item.url) : item.url;
  
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
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Lazy-loading image */}
      <img
        src={imageSrc}
        alt={item.alt || 'Media'}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Video overlays - using same VideoPlayIndicator as explore/discover pages */}
      {isVideo && (
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
