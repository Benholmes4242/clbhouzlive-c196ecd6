import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
    setCurrentIndex(0);
  }, [feedIndex, setCarouselPosition]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, mediaItems.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setCurrentIndex(clamped);
    setCarouselPosition(feedIndex, clamped);
  }, [feedIndex, mediaItems.length, setCarouselPosition]);

  // Listen for programmatic carousel-goto events from the action rail
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.feedIndex === feedIndex) {
        goTo(detail.mediaIndex);
      }
    };
    window.addEventListener('carousel-goto', handler);
    return () => window.removeEventListener('carousel-goto', handler);
  }, [feedIndex, goTo]);

  return (
    <div className="absolute inset-0" style={{ touchAction: 'pan-y' }}>
      {/* Scroll container — no touch scrolling, programmatic only */}
      <div
        ref={scrollRef}
        className="absolute inset-0 flex"
        style={{
          overflowX: 'hidden',
          pointerEvents: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {mediaItems.map((item, idx) => {
          const isLandscape = (item.width ?? 0) > (item.height ?? 1);
          const objectFit = isSuggestedFeed ? 'cover' : (isLandscape ? 'contain' : 'cover');
          return (
            <div
              key={item.id || idx}
              className="flex-shrink-0 w-full h-full relative"
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
      {/* All carousel navigation (prev/next) is handled by CinematicActionRail */}
    </div>
  );
});

export default FeedImageCarousel;
