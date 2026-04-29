import React, { useCallback, useState, useRef, useEffect, memo } from 'react';
import { Play } from 'lucide-react';
import CarouselDots from '@/components/media/CarouselDots';
import type { MediaItem } from '@/components/media-system/types/media';

interface PostFeedCarouselProps {
  mediaItems: MediaItem[];
  /** Optional click target — receives the active media index. */
  onSlideClick?: (mediaIndex: number) => void;
  /** Aspect ratio class (e.g. 'aspect-[4/5]'). Defaults to 'aspect-square'. */
  aspectClass?: string;
  /** Optional overlays rendered above slides (e.g. duration badge, rating badge). */
  topRightOverlay?: React.ReactNode;
  bottomRightOverlay?: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Profile feed multi-media carousel.
 *
 * Lightweight horizontal swipe with CarouselDots overlay. Used in profile
 * post cards (LoopCard, etc.) where the goal is a thumbnail preview, NOT
 * full video playback. Tap any slide to open fullscreen.
 *
 * For Clubhouse-style fullscreen playback with HLS + pinch-zoom, use
 * FeedImageCarousel instead.
 *
 * Returns null-safe: 0 items renders nothing; 1 item renders without dots.
 */
export const PostFeedCarousel = memo(function PostFeedCarousel({
  mediaItems,
  onSlideClick,
  aspectClass = 'aspect-square',
  topRightOverlay,
  bottomRightOverlay,
  ariaLabel,
}: PostFeedCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    locked: 'none' as 'none' | 'horizontal' | 'vertical',
    swiping: false,
  });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      setCurrentSlide(Math.max(0, Math.min(idx, mediaItems.length - 1)));
    },
    [mediaItems.length],
  );

  const LOCK_THRESHOLD = 10;
  const SWIPE_THRESHOLD = 50;

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimating) return;
      const touch = e.touches[0];
      touchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        locked: 'none',
        swiping: false,
      };
      setSwipeOffset(0);
      setIsDragging(false);
    },
    [isAnimating],
  );

  // Native touchmove with { passive: false } so we can preventDefault on horizontal lock
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating) return;
      const t = touchRef.current;
      const touch = e.touches[0];
      const dx = touch.clientX - t.startX;
      const dy = touch.clientY - t.startY;

      if (t.locked === 'none') {
        if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
        t.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
      if (t.locked === 'vertical') return;

      // Horizontal — block parent vertical scroll while swiping
      e.preventDefault();
      t.swiping = true;
      setIsDragging(true);

      const atStart = currentSlide === 0 && dx > 0;
      const atEnd = currentSlide === mediaItems.length - 1 && dx < 0;
      const dampened = atStart || atEnd ? dx * 0.25 : dx;
      setSwipeOffset(dampened);
    };
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [isAnimating, currentSlide, mediaItems.length]);

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
        setIsAnimating(true);
        const direction = targetSlide > currentSlide ? -containerWidth : containerWidth;
        setSwipeOffset(direction);
        setTimeout(() => {
          setIsDragging(false);
          setSwipeOffset(0);
          setIsAnimating(false);
          goTo(targetSlide);
          // Clear swiping flag after the transition so click handler can fire next tap.
          touchRef.current.swiping = false;
        }, 300);
      } else {
        setIsAnimating(true);
        setSwipeOffset(0);
        setTimeout(() => {
          setIsDragging(false);
          setIsAnimating(false);
          touchRef.current.swiping = false;
        }, 300);
      }
    } else {
      setIsDragging(false);
      setSwipeOffset(0);
      touchRef.current.swiping = false;
    }

    touchRef.current.locked = 'none';
  }, [swipeOffset, currentSlide, mediaItems.length, goTo, isAnimating]);

  if (mediaItems.length === 0) return null;

  const handleSlideClick = () => {
    // Don't fire if user just swiped
    if (touchRef.current.swiping) return;
    onSlideClick?.(currentSlide);
  };

  const getSlideTransform = (idx: number) => {
    const containerWidth = containerRef.current?.offsetWidth || 430;
    const diff = idx - currentSlide;
    if (Math.abs(diff) > 1) return { translateX: diff * containerWidth, opacity: 0 };
    const baseOffset = diff * containerWidth;
    return { translateX: baseOffset + swipeOffset, opacity: 1 };
  };

  const transitionStyle = isAnimating
    ? 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)'
    : 'none';

  return (
    <div
      className={`relative w-full ${aspectClass} bg-muted overflow-hidden select-none`}
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ touchAction: mediaItems.length > 1 ? 'pan-y' : 'auto' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={handleSlideClick}
      >
        {mediaItems.map((item, idx) => {
          const diff = Math.abs(idx - currentSlide);
          if (diff > 1 && !isDragging && !isAnimating) return null;

          const { translateX, opacity } = getSlideTransform(idx);
          const imgSrc = item.thumbnailUrl || item.imageUrl || '';
          const isVideo = item.type === 'video';

          return (
            <div
              key={item.id ?? idx}
              className="absolute inset-0"
              style={{
                transform: `translate3d(${translateX}px, 0, 0)`,
                opacity,
                transition: transitionStyle,
                willChange: 'transform',
              }}
            >
              {imgSrc && (
                <img
                  src={imgSrc}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              )}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
                  >
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Carousel dots — top center */}
      {mediaItems.length > 1 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <CarouselDots count={mediaItems.length} active={currentSlide} />
        </div>
      )}

      {/* Pass-through overlays */}
      {topRightOverlay && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">{topRightOverlay}</div>
      )}
      {bottomRightOverlay && (
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          {bottomRightOverlay}
        </div>
      )}
    </div>
  );
});

export default PostFeedCarousel;
