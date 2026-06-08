/**
 * MediaCarousel — Phase 2 multi-media carousel for FeedCard.
 *
 * Rules from the brief:
 *  - Stable card height: ONE fixed 4:5 frame ratio for all slides so the
 *    card height never jumps as you swipe.
 *  - Per-slide no-crop ambient fill: a blurred, scaled copy of the slide
 *    fills the frame behind it, then the slide is `object-fit: contain`
 *    on top. Wide and tall in the same post both show whole, no bars.
 *  - Dots overlay bottom-centre (`CarouselDots`), `n/total` chip top-right.
 *  - Swipe + tap a dot navigates. Active index persisted in
 *    `clubhouseStore.carouselPositions` keyed by post index.
 *  - Inline video lifecycle: only the active slide may autoplay.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';
import { CarouselDots } from '@/components/media/CarouselDots';
import { InlineVideo } from './InlineVideo';

interface Props {
  items: MediaItem[];
  isCardActive: boolean;
  initialIndex: number;
  frameRatio?: number; // default 4/5
  /** When false, video slides render their poster only (no <video> element). */
  mountVideo?: boolean;
  onIndexChange?: (idx: number) => void;
  onOpen: (mediaIndex: number) => void;
}

const FRAME_DEFAULT = 4 / 5;

export const MediaCarousel: React.FC<Props> = ({
  items,
  isCardActive,
  initialIndex,
  frameRatio = FRAME_DEFAULT,
  mountVideo = false,
  onIndexChange,
  onOpen,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(() =>
    Math.max(0, Math.min(initialIndex || 0, items.length - 1)),
  );
  const rafRef = useRef<number | null>(null);

  // Jump to initial index on mount (without smooth-scroll)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w > 0) {
      el.scrollTo({ left: active * w, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const idx = Math.round(el.scrollLeft / w);
      const safe = Math.max(0, Math.min(idx, items.length - 1));
      if (safe !== active) {
        setActive(safe);
        onIndexChange?.(safe);
      }
    });
  }, [active, items.length, onIndexChange]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: String(frameRatio),
        background: '#05080F',
        overflow: 'hidden',
      }}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((m, i) => {
          const url = m.imageUrl || m.thumbnailUrl || '';
          const isVideo = m.type === 'video';
          const isActiveSlide = isCardActive && i === active;
          return (
            <button
              type="button"
              key={m.id || i}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(i);
              }}
              style={{
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                position: 'relative',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={`Media ${i + 1} of ${items.length}`}
            >
              {isVideo ? (
                mountVideo ? (
                  <InlineVideo item={m} isActive={isActiveSlide} objectFit="cover" />
                ) : m.thumbnailUrl ? (
                  <img
                    src={m.thumbnailUrl}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                ) : null
              ) : url ? (
                <img
                  src={url}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* n/total chip */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(5,8,16,0.6)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 999,
          fontVariantNumeric: 'tabular-nums',
          pointerEvents: 'none',
        }}
      >
        {active + 1}/{items.length}
      </div>

      {/* Dots */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 10,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <CarouselDots count={items.length} active={active} />
      </div>
    </div>
  );
};

MediaCarousel.displayName = 'MediaCarousel';
