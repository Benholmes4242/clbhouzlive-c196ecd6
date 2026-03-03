/**
 * MediaCarousel — horizontal swipe navigation for multi-media posts.
 * Uses transform-based movement with gesture disambiguation (H vs V lock).
 * Only renders for posts with >1 media items.
 */
import { useRef, useState, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';
import { CarouselIndicator } from './CarouselIndicator';
import { useMediaStore } from './store/mediaStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from './types/media';

interface MediaCarouselProps {
  mediaItems: MediaItem[];
  feedIndex: number;
  isActive: boolean;
  onDoubleTapLike?: () => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms
const SWIPE_DISPLACEMENT_FRACTION = 0.3; // 30% of screen width
const H_LOCK_RATIO = 1.5;
const LOCK_THRESHOLD = 10; // px

type DirLock = 'none' | 'horizontal' | 'vertical';

export function MediaCarousel({
  mediaItems, feedIndex, isActive,
  onDoubleTapLike, onScrubStart, onScrubEnd,
}: MediaCarouselProps) {
  const activeMedia = useMediaStore((s) => s.carouselPositions.get(feedIndex) ?? 0);
  const setCarouselPosition = useMediaStore((s) => s.setCarouselPosition);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const dirLock = useRef<DirLock>('none');
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const total = mediaItems.length;

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    setIsAnimating(true);
    setTranslateX(0);
    setCarouselPosition(feedIndex, clamped);
    setTimeout(() => setIsAnimating(false), 260);
  }, [total, feedIndex, setCarouselPosition]);

  // ── Touch handlers ────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    dirLock.current = 'none';
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsAnimating(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Lock direction
    if (dirLock.current === 'none') {
      if (absDx > LOCK_THRESHOLD && absDx > absDy * H_LOCK_RATIO) {
        dirLock.current = 'horizontal';
      } else if (absDy > LOCK_THRESHOLD && absDy > absDx * H_LOCK_RATIO) {
        dirLock.current = 'vertical';
        return; // Let feed handle vertical
      }
    }

    if (dirLock.current === 'horizontal') {
      e.stopPropagation();
      // Rubber-band at edges
      let offset = dx;
      if ((activeMedia === 0 && dx > 0) || (activeMedia === total - 1 && dx < 0)) {
        offset = dx / 3;
      }
      setTranslateX(offset);
    }
  }, [activeMedia, total]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (dirLock.current !== 'horizontal') {
      dirLock.current = 'none';
      setTranslateX(0);
      return;
    }

    e.stopPropagation();
    const touch = e.changedTouches[0];
    const dx = touch ? touch.clientX - touchStart.current.x : 0;
    const elapsed = Date.now() - touchStart.current.time;
    const velocity = Math.abs(dx) / Math.max(elapsed, 1);
    const width = containerRef.current?.offsetWidth ?? window.innerWidth;

    if (velocity > SWIPE_VELOCITY_THRESHOLD || Math.abs(dx) > width * SWIPE_DISPLACEMENT_FRACTION) {
      if (dx < 0 && activeMedia < total - 1) {
        goTo(activeMedia + 1);
      } else if (dx > 0 && activeMedia > 0) {
        goTo(activeMedia - 1);
      } else {
        // Snap back
        setIsAnimating(true);
        setTranslateX(0);
        setTimeout(() => setIsAnimating(false), 260);
      }
    } else {
      // Snap back
      setIsAnimating(true);
      setTranslateX(0);
      setTimeout(() => setIsAnimating(false), 260);
    }

    dirLock.current = 'none';
  }, [activeMedia, total, goTo]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Carousel track */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(calc(-${activeMedia * 100}% + ${translateX}px))`,
          transition: isAnimating ? 'transform 250ms ease-out' : 'none',
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mediaItems.map((item, idx) => (
          <div key={item.id} className="flex-shrink-0 w-full h-full">
            {item.type === 'video' && item.hlsUrl ? (
              <VideoPlayer
                hlsUrl={item.hlsUrl}
                feedIndex={feedIndex * 100 + idx}
                isActive={isActive && idx === activeMedia}
                thumbnailUrl={item.thumbnailUrl}
                duration={item.duration}
                onDoubleTapLike={onDoubleTapLike}
                onScrubStart={onScrubStart}
                onScrubEnd={onScrubEnd}
              />
            ) : item.imageUrl ? (
              <ImageViewer
                imageUrl={item.imageUrl}
                thumbnailUrl={item.thumbnailUrl}
                width={item.width}
                height={item.height}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Carousel dots */}
      <CarouselIndicator total={total} activeIndex={activeMedia} />

      {/* Chevron arrows */}
      {activeMedia > 0 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { e.stopPropagation(); goTo(activeMedia - 1); }}
          aria-label="Previous media"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      {activeMedia < total - 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { e.stopPropagation(); goTo(activeMedia + 1); }}
          aria-label="Next media"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
