import React, { useCallback, useEffect, useState, useRef, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import type { MediaItem } from '@/components/media-system/types/media';

interface FeedImageCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isSuggestedFeed: boolean;
  isActive?: boolean;
  onDoubleTapLike?: () => void;
  onZoomChange?: (isZoomed: boolean) => void;
}

// Inner component for each zoomable image slide
const ZoomableImageSlide: React.FC<{
  imgSrc: string;
  objectFit: 'cover' | 'contain';
  loading: 'eager' | 'lazy';
  onZoomChange?: (isZoomed: boolean) => void;
  slideIndex: number;
  currentSlide: number;
}> = memo(({ imgSrc, objectFit, loading, onZoomChange, slideIndex, currentSlide }) => {
  const { ref, imgRef, style, scale, reset } = usePinchZoomPointer();

  // Reset zoom when this slide is no longer current
  useEffect(() => {
    if (slideIndex !== currentSlide) reset();
  }, [slideIndex, currentSlide, reset]);

  // Report zoom state
  useEffect(() => {
    onZoomChange?.(scale > 1);
  }, [scale, onZoomChange]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={imgSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
        draggable={false}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div
        ref={ref}
        style={{ ...style, position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <img
          ref={imgRef}
          src={imgSrc}
          alt=""
          className="w-full h-full"
          style={{ objectFit }}
          loading={loading}
          draggable={false}
        />
      </div>
    </div>
  );
});
ZoomableImageSlide.displayName = 'ZoomableImageSlide';

export const FeedImageCarousel = memo(function FeedImageCarousel({
  mediaItems,
  feedIndex,
  isSuggestedFeed,
  isActive = false,
  onDoubleTapLike,
  onZoomChange,
}: FeedImageCarouselProps) {
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const setCarouselPosition = useClubhouseStore(s => s.setCarouselPosition);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

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

  // Propagate zoom state to parent
  const handleImageZoomChange = useCallback((zoomed: boolean) => {
    setIsImageZoomed(zoomed);
    onZoomChange?.(zoomed);
  }, [onZoomChange]);

  // ── Touch handlers for horizontal swipe ──
  const LOCK_THRESHOLD = 10;
  const SWIPE_THRESHOLD = 50;
  const isDraggingHorizontally = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating || isImageZoomed) return;
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
  }, [isAnimating, isImageZoomed]);

  // Native touchmove with { passive: false } so preventDefault() works
  const touchMoveStateRef = useRef({ currentSlide, mediaItemsLength: mediaItems.length, isAnimating, isImageZoomed });
  useEffect(() => {
    touchMoveStateRef.current = { currentSlide, mediaItemsLength: mediaItems.length, isAnimating, isImageZoomed };
  }, [currentSlide, mediaItems.length, isAnimating, isImageZoomed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => {
      const { isAnimating: anim, currentSlide: cs, mediaItemsLength: len, isImageZoomed: zoomed } = touchMoveStateRef.current;
      if (anim || zoomed) return;
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
    if (isAnimating || isImageZoomed) return;

    if (t.locked === 'horizontal' && t.swiping) {
      const containerWidth = containerRef.current?.offsetWidth || 430;
      let targetSlide = currentSlide;

      if (swipeOffset < -SWIPE_THRESHOLD && currentSlide < mediaItems.length - 1) {
        targetSlide = currentSlide + 1;
      } else if (swipeOffset > SWIPE_THRESHOLD && currentSlide > 0) {
        targetSlide = currentSlide - 1;
      }

      if (targetSlide !== currentSlide) {
        setIsAnimating(true);
        const direction = targetSlide > currentSlide ? -containerWidth : containerWidth;
        setSwipeOffset(direction);

        setTimeout(() => {
          setIsDragging(false);
          setSwipeOffset(0);
          setIsAnimating(false);
          goTo(targetSlide);
        }, 300);
      } else {
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
  }, [swipeOffset, currentSlide, mediaItems.length, goTo, isAnimating, isImageZoomed]);

  const getSlideTransform = (idx: number): { translateX: string; opacity: number; pointerEvents: 'auto' | 'none' } => {
    const containerWidth = containerRef.current?.offsetWidth || 430;
    const diff = idx - currentSlide;

    if (Math.abs(diff) > 1) {
      return { translateX: `${diff * containerWidth}px`, opacity: 0, pointerEvents: 'none' };
    }

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
      style={{ touchAction: isImageZoomed ? 'none' : 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {mediaItems.map((item, idx) => {
        const diff = Math.abs(idx - currentSlide);
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
                activeIndex={activeIndex}
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
          <div key={item.id || idx} className="absolute inset-0" style={slideStyle}>
            <ZoomableImageSlide
              imgSrc={imgSrc}
              objectFit={objectFit}
              loading={idx === 0 ? 'eager' : 'lazy'}
              onZoomChange={handleImageZoomChange}
              slideIndex={idx}
              currentSlide={currentSlide}
            />
          </div>
        );
      })}
    </div>
  );
});
export default FeedImageCarousel;
