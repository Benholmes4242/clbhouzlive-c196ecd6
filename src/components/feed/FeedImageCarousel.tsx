import React, { useRef, useCallback, useEffect, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
  snapFeedRef?: React.RefObject<HTMLDivElement>;
}

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
  snapFeedRef,
}: FeedImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);

  // Gesture tracking refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartFeedScrollTop = useRef(0);
  const axis = useRef<'h' | 'v' | null>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselPosition(feedIndex, idx);
  }, [feedIndex, setCarouselPosition]);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
  }, [feedIndex, setCarouselPosition]);

  // Non-passive native touch listeners — MUST be native, not React synthetic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartFeedScrollTop.current = snapFeedRef?.current?.scrollTop ?? 0;
      axis.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // Determine axis on first meaningful movement
      if (axis.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        axis.current = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      }

      if (axis.current === 'v') {
        // Prevent carousel from claiming this event
        e.preventDefault();

        // Drive SnapFeed scroll directly
        const feed = snapFeedRef?.current;
        if (feed) {
          feed.scrollTop = touchStartFeedScrollTop.current - dy;
        }
      }
      // horizontal: let the carousel handle it naturally
    };

    const onTouchEnd = () => {
      if (axis.current === 'v') {
        // Snap to nearest slide
        const feed = snapFeedRef?.current;
        if (feed) {
          const slideHeight = feed.clientHeight;
          const nearestSlide = Math.round(feed.scrollTop / slideHeight);
          feed.scrollTo({ top: nearestSlide * slideHeight, behavior: 'smooth' });
        }
      }
      axis.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false }); // non-passive: critical
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [snapFeedRef]);

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
        overscrollBehavior: 'contain',
        overflowY: 'hidden',
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
