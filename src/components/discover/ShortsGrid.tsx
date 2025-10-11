import React, { useEffect, useRef, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ShortsGrid({ items, onOpen, isLoading, hasMore, onLoadMore }: ShortsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [visibleVideos, setVisibleVideos] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800;

      if (scrollTop > scrollThreshold && onLoadMore) {
        loadingRef.current = true;
        onLoadMore();
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore]);

  // Determine if a card should auto-play based on grid position
  const shouldAutoPlay = (index: number): boolean => {
    const cols = 3; // Base grid is 3 columns
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Odd rows (0-indexed, so row 0, 2, 4... are "odd" visually) → left card (col 0)
    // Even rows (1, 3, 5... visually) → right card (col 2)
    if (row % 2 === 0) {
      return col === 0; // Left card
    } else {
      return col === 2; // Right card
    }
  };
  return (
    <>
      <div
        ref={gridRef}
        className="
          grid
          grid-cols-3
          md:grid-cols-4
          xl:grid-cols-5
          pb-4
        "
        style={{ gap: '1px' }}
      >
        {items.map((item, index) => {
          const autoPlay = shouldAutoPlay(index);
          const isVideo = item.type === 'video';
          
          return (
            <button
              key={item.id}
              className="group relative aspect-[9/16] overflow-hidden bg-muted"
              onClick={() => onOpen(item)}
            >
              {isVideo && autoPlay ? (
                <div className="absolute inset-0">
                  <EnhancedVideoPlayer
                    src={item.src}
                    poster={item.thumbnailSrc}
                    autoplay={true}
                    muted={true}
                    loop={true}
                    playsInline={true}
                    controls={false}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <img
                  src={item.thumbnailSrc || item.src}
                  alt={item.title || ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              {/* Hover overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
            </button>
          );
        })}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </>
  );
}
