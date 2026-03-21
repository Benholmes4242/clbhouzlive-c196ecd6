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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselPosition(feedIndex, idx);
  }, [feedIndex, setCarouselPosition]);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
  }, [feedIndex, setCarouselPosition]);

  // DEBUG — wheel events
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const el = scrollRef.current;
    console.log(`[CAROUSEL-${feedIndex}] wheel deltaX=${e.deltaX.toFixed(1)} deltaY=${e.deltaY.toFixed(1)} scrollLeft=${el?.scrollLeft.toFixed(0)} scrollWidth=${el?.scrollWidth} clientWidth=${el?.clientWidth} defaultPrevented=${e.defaultPrevented} cancelable=${e.cancelable}`);
  }, [feedIndex]);

  // DEBUG — touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    console.log(`[CAROUSEL-${feedIndex}] touchstart x=${t.clientX.toFixed(0)} y=${t.clientY.toFixed(0)}`);
  }, [feedIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    console.log(`[CAROUSEL-${feedIndex}] touchmove x=${t.clientX.toFixed(0)} y=${t.clientY.toFixed(0)} defaultPrevented=${e.defaultPrevented} cancelable=${e.cancelable}`);
  }, [feedIndex]);

  const handleTouchEnd = useCallback(() => {
    console.log(`[CAROUSEL-${feedIndex}] touchend`);
  }, [feedIndex]);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 flex overflow-x-auto"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        touchAction: 'pan-x',
      }}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
