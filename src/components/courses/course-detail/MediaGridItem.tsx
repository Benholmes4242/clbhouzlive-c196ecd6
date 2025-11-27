import React, { memo } from 'react';
import type { ExtendedMediaItem } from '@/components/media-grid';

interface MediaGridItemProps {
  item: ExtendedMediaItem;
  onClick: (item: ExtendedMediaItem) => void;
}

/**
 * Phase 1 Fix #4: Memoized grid item to prevent unnecessary re-renders on filter changes
 */
export const MediaGridItem = memo(function MediaGridItem({ item, onClick }: MediaGridItemProps) {
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
      className="relative aspect-square rounded-[var(--squircle-radius)] overflow-hidden bg-slate-200 border border-slate-300/40 shadow-sm hover:shadow-md transition-shadow duration-150"
    >
      {/* Phase 1 Fix #1: Lazy-loading thumbnails */}
      <img
        src={imageSrc}
        alt={item.alt || 'Media'}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Video overlays: gradient + duration */}
      {isVideo && (
        <>
          {/* Bottom gradient for readability */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Duration pill */}
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 2v12l10-6L3 2z" />
              </svg>
              <span className="text-[10px] font-medium text-white">
                {formatDuration(item.duration)}
              </span>
            </div>
          </div>
        </>
      )}
    </button>
  );
});
