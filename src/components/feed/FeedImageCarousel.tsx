import React, { useCallback, useEffect, useState, useRef, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
  isActive?: boolean;
  onDoubleTapLike?: () => void;
}

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
  isActive = false,
  onDoubleTapLike,
}: FeedImageCarouselProps) {
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Horizontal swipe state ──
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{
    startX: number;
    startY: number;
    locked: 'none' | 'horizontal' | 'vertical';
    swiping: boolean;
  }>({ startX: 0, startY: 0, locked: 'none', swiping: false });
  const [swipeOffset, setSwipeOffset] = useState(0);

  useEffect(() => {
    setCarouselPosition(feedIndex, 0);
    setCurrentSlide(0);
  }, [feedIndex, setCarouselPosition]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, mediaItems.length - 1));
    setCurrentSlide(clamped);
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

  // ── Touch handlers for horizontal swipe ──
  const LOCK_THRESHOLD = 10;  // px before we decide axis
  const SWIPE_THRESHOLD = 50; // px to trigger slide change

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      locked: 'none',
      swiping: false,
    };
    setSwipeOffset(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;
    const touch = e.touches[0];
    const dx = touch.clientX - t.startX;
    const dy = touch.clientY - t.startY;

    if (t.locked === 'none') {
      // Haven't decided axis yet — wait for enough movement
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
      t.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (t.locked === 'vertical') return; // Let vertical scroll through

    // Horizontal lock — prevent vertical scroll
    e.preventDefault();
    t.swiping = true;

    // Add resistance at edges
    const atStart = currentSlide === 0 && dx > 0;
    const atEnd = currentSlide === mediaItems.length - 1 && dx < 0;
    const dampened = (atStart || atEnd) ? dx * 0.25 : dx;
    setSwipeOffset(dampened);
  }, [currentSlide, mediaItems.length]);

  const onTouchEnd = useCallback(() => {
    const t = touchRef.current;
    if (t.locked === 'horizontal' && t.swiping) {
      if (swipeOffset < -SWIPE_THRESHOLD && currentSlide < mediaItems.length - 1) {
        goTo(currentSlide + 1);
      } else if (swipeOffset > SWIPE_THRESHOLD && currentSlide > 0) {
        goTo(currentSlide - 1);
      }
    }
    touchRef.current = { startX: 0, startY: 0, locked: 'none', swiping: false };
    setSwipeOffset(0);
  }, [swipeOffset, currentSlide, mediaItems.length, goTo]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {mediaItems.map((item, idx) => {
        const isVisible = currentSlide === idx;
        // Calculate transform for swipe animation
        const offset = (idx - currentSlide) * 100;
        const pixelShift = isVisible ? swipeOffset : 0;

        if (item.type === 'video') {
          return (
            <div
              key={item.id || idx}
              className="absolute inset-0"
              style={{
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                transform: isVisible && swipeOffset !== 0 ? `translateX(${pixelShift}px)` : undefined,
                willChange: swipeOffset !== 0 ? 'transform' : undefined,
              }}
            >
              <SnapVideoPlayer
                hlsUrl={item.hlsUrl || ''}
                mp4Url={item.mp4Url}
                thumbnailUrl={item.thumbnailUrl}
                width={item.width}
                height={item.height}
                duration={item.duration}
                isActive={isActive && isVisible}
                feedIndex={feedIndex}
                isSuggestedFeed={isSuggestedFeed}
                onDoubleTapLike={onDoubleTapLike}
              />
            </div>
          );
        }

        // Image slide
        const isLandscape = (item.width ?? 0) > (item.height ?? 1);
        const objectFit = isLandscape ? 'contain' : 'cover';
        const imgSrc = item.imageUrl || item.thumbnailUrl || '';
        return (
          <div
            key={item.id || idx}
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: isVisible ? 1 : 0,
              pointerEvents: isVisible ? 'auto' : 'none',
              transform: isVisible && swipeOffset !== 0 ? `translateX(${pixelShift}px)` : undefined,
              willChange: swipeOffset !== 0 ? 'transform' : undefined,
            }}
          >
            {/* Blurred background for letterboxing */}
            <img
              src={imgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
              draggable={false}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/55" />
            {/* Main image */}
            <img
              src={imgSrc}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit, position: 'relative', zIndex: 1 }}
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
