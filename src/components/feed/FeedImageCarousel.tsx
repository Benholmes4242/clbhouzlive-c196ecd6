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
  const activeIndex = useClubhouseStore(s => s.activeIndex);
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  const LOCK_THRESHOLD = 10;
  const SWIPE_THRESHOLD = 50;
  const isDraggingHorizontally = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      locked: 'none',
      swiping: false,
    };
    isDraggingHorizontally.current = false;
    setSwipeOffset(0);
    setIsDragging(false);
  }, [isAnimating]);

  // Native touchmove with { passive: false } so preventDefault() works
  const touchMoveStateRef = useRef({ currentSlide, mediaItemsLength: mediaItems.length, isAnimating });
  useEffect(() => {
    touchMoveStateRef.current = { currentSlide, mediaItemsLength: mediaItems.length, isAnimating };
  }, [currentSlide, mediaItems.length, isAnimating]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => {
      const { isAnimating: anim, currentSlide: cs, mediaItemsLength: len } = touchMoveStateRef.current;
      if (anim) return;
      const t = touchRef.current;
      const touch = e.touches[0];
      const dx = touch.clientX - t.startX;
      const dy = touch.clientY - t.startY;

      if (t.locked === 'none') {
        if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
        t.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (t.locked === 'vertical') {
        isDraggingHorizontally.current = false;
        return;
      }

      // No preventDefault needed — touchAction: 'none' on container handles it
      isDraggingHorizontally.current = true;
      t.swiping = true;
      setIsDragging(true);

      const atStart = cs === 0 && dx > 0;
      const atEnd = cs === len - 1 && dx < 0;
      const dampened = (atStart || atEnd) ? dx * 0.25 : dx;
      setSwipeOffset(dampened);
    };
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, []);

  const onTouchEnd = useCallback(() => {
    const t = touchRef.current;
    if (isAnimating) return;

    if (t.locked === 'horizontal' && t.swiping) {
      const containerWidth = containerRef.current?.offsetWidth || 430;
      let targetSlide = currentSlide;

      if (swipeOffset < -SWIPE_THRESHOLD && currentSlide < mediaItems.length - 1) {
        targetSlide = currentSlide + 1;
      } else if (swipeOffset > SWIPE_THRESHOLD && currentSlide > 0) {
        targetSlide = currentSlide - 1;
      }

      if (targetSlide !== currentSlide) {
        // Animate to the target: set offset to full width in the swipe direction
        setIsAnimating(true);
        const direction = targetSlide > currentSlide ? -containerWidth : containerWidth;
        setSwipeOffset(direction);

        // After transition completes, snap to new slide
        setTimeout(() => {
          setIsDragging(false);
          setSwipeOffset(0);
          setIsAnimating(false);
          goTo(targetSlide);
        }, 300);
      } else {
        // Snap back — animate offset back to 0
        setIsAnimating(true);
        setSwipeOffset(0);
        setTimeout(() => {
          setIsDragging(false);
          setIsAnimating(false);
        }, 300);
      }
    } else {
      setIsDragging(false);
      setSwipeOffset(0);
    }

    touchRef.current = { startX: 0, startY: 0, locked: 'none', swiping: false };
  }, [swipeOffset, currentSlide, mediaItems.length, goTo, isAnimating]);

  // Determine which slides need to be rendered (current + adjacent for smooth sliding)
  const getSlideTransform = (idx: number): { translateX: string; opacity: number; pointerEvents: 'auto' | 'none' } => {
    const containerWidth = containerRef.current?.offsetWidth || 430;
    const diff = idx - currentSlide;

    // Only render current and immediately adjacent slides
    if (Math.abs(diff) > 1) {
      return { translateX: `${diff * containerWidth}px`, opacity: 0, pointerEvents: 'none' };
    }

    // Base position: each slide offset by full container width
    const baseOffset = diff * containerWidth;
    const finalOffset = baseOffset + swipeOffset;

    const isCurrentOrAdjacent = diff === 0 || (isDragging || isAnimating);
    return {
      translateX: `${finalOffset}px`,
      opacity: isCurrentOrAdjacent ? 1 : 0,
      pointerEvents: diff === 0 && !isAnimating ? 'auto' : 'none',
    };
  };

  const transitionStyle = (isAnimating && !isDragging) || isAnimating
    ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'none';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {mediaItems.map((item, idx) => {
        const diff = Math.abs(idx - currentSlide);
        // Only render current slide and its immediate neighbours
        if (diff > 1 && !isDragging && !isAnimating) return null;

        const { translateX, opacity, pointerEvents } = getSlideTransform(idx);
        const isVisible = idx === currentSlide;

        const slideStyle: React.CSSProperties = {
          transform: `translateX(${translateX})`,
          opacity,
          pointerEvents,
          transition: transitionStyle,
          willChange: isDragging || isAnimating ? 'transform' : undefined,
        };

        if (item.type === 'video') {
          return (
            <div key={item.id || idx} className="absolute inset-0" style={slideStyle}>
              <SnapVideoPlayer
                hlsUrl={item.hlsUrl || ''}
                mp4Url={item.mp4Url}
                thumbnailUrl={item.thumbnailUrl}
                width={item.width}
                height={item.height}
                duration={item.duration}
                isActive={isActive && isVisible}
                activeIndex={useClubhouseStore.getState().activeIndex}
                feedIndex={feedIndex}
                isSuggestedFeed={isSuggestedFeed}
                onDoubleTapLike={onDoubleTapLike}
              />
            </div>
          );
        }

        const isLandscape = (item.width ?? 0) > (item.height ?? 1);
        const objectFit = isLandscape ? 'contain' : 'cover';
        const imgSrc = item.imageUrl || item.thumbnailUrl || '';
        return (
          <div key={item.id || idx} className="absolute inset-0 overflow-hidden" style={slideStyle}>
            <img
              src={imgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
              draggable={false}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/55" />
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
