import React, { useRef, useCallback, useEffect, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
}

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
}: FeedImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);

  // Track scroll position to update carousel dots
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselPosition(feedIndex, idx);
  }, [feedIndex, setCarouselPosition]);

  // Reset scroll on mount
  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
  }, [feedIndex, setCarouselPosition]);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 flex overflow-x-auto"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      onScroll={handleScroll}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      {mediaItems.map((item, idx) => {
        const isLandscape = (item.width ?? 0) > (item.height ?? 1);
        const objectFit = isSuggestedFeed ? 'cover' : (isLandscape ? 'contain' : 'cover');

        return (
          <div
            key={item.id || idx}
            className="flex-shrink-0 w-full h-full relative"
            style={{ scrollSnapAlign: 'start' }}
          >
            <img
              src={item.imageUrl || item.thumbnailUrl || ''}
              alt=""
              className="w-full h-full"
              style={{ objectFit, background: '#000' }}
              loading={idx === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
});

export default FeedImageCarousel;
