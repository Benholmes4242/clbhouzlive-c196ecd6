import React, { memo, useState } from 'react';
import type { ExtendedMediaItem } from '@/components/media-grid';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';

interface MediaGridItemProps {
  item: ExtendedMediaItem;
  onClick: (item: ExtendedMediaItem) => void;
  /** Show "+X" overlay for additional media count */
  overflowCount?: number;
}

/**
 * Phase 1 Fix #4: Memoized grid item to prevent unnecessary re-renders on filter changes
 * Polish: skeleton placeholder, centered play icon, consistent styling
 */
export const MediaGridItem = memo(function MediaGridItem({ item, onClick, overflowCount }: MediaGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = item.type === 'video';
  const imageSrc = isVideo ? (item.posterUrl || item.url) : item.url;
  
  // Format duration for display
  const formatDuration = (seconds?: number) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <button
      onClick={() => onClick(item)}
      className="relative aspect-square overflow-hidden bg-muted border-[0.5px] border-border/30 hover:brightness-95 active:scale-[0.98] transition-all duration-150"
    >
      {/* Skeleton placeholder - shows until image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Lazy-loading image */}
      <img
        src={imageSrc}
        alt={item.alt || 'Media'}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Video overlays: bottom-left play icon + duration pill */}
      {isVideo && (
        <>
          {/* Bottom-left play icon - matching VideoPlayIndicator */}
          <VideoPlayIndicator size="md" />

          {/* Duration pill - bottom right */}
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm">
              <span className="text-[10px] font-medium text-white tabular-nums">
                {formatDuration(item.duration)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* "+X more" overlay for overflow indication */}
      {overflowCount && overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <span className="text-lg font-semibold text-white">+{overflowCount}</span>
        </div>
      )}
    </button>
  );
});
