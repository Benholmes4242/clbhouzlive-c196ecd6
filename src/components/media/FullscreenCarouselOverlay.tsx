/**
 * FullscreenCarouselOverlay — segments dots + tap-edge zones for fullscreen viewers.
 *
 * Used by FullscreenFeedOverlay and CourseMediaViewer. Reads the active post's
 * media count and current carousel slide from the global Clubhouse store
 * (FeedImageCarousel writes to setCarouselPosition). Tap-edge dispatches the
 * existing `carousel-goto` window event that FeedImageCarousel already listens
 * for — no swipe-logic changes.
 *
 * Returns null for single-media posts (CarouselDots also self-guards but we
 * skip rendering tap-edge zones too).
 */
import React, { useCallback } from 'react';
import { CarouselDots, useCarouselDotsVisibility } from '@/components/media/CarouselDots';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { FeedPost } from '@/components/media-system/types/media';

interface FullscreenCarouselOverlayProps {
  activePost: FeedPost | null;
  activeIndex: number;
}

export const FullscreenCarouselOverlay: React.FC<FullscreenCarouselOverlayProps> = ({
  activePost,
  activeIndex,
}) => {
  const carouselSlide = useClubhouseStore(
    (s) => s.carouselPositions.get(activeIndex) ?? 0,
  );

  const count = activePost?.mediaItems?.length ?? 0;

  // Hooks must run unconditionally
  const isVisible = useCarouselDotsVisibility(carouselSlide);

  const goTo = useCallback(
    (mediaIndex: number) => {
      const clamped = Math.max(0, Math.min(mediaIndex, count - 1));
      window.dispatchEvent(
        new CustomEvent('carousel-goto', {
          detail: { feedIndex: activeIndex, mediaIndex: clamped },
        }),
      );
    },
    [activeIndex, count],
  );

  if (!activePost || count <= 1) return null;

  return (
    <>
      {/* Dots — segments variant, just below top chrome */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
          left: 16,
          right: 16,
          zIndex: 9029,
        }}
      >
        <CarouselDots
          count={count}
          active={carouselSlide}
          variant="segments"
          isVisible={isVisible}
        />
      </div>

      {/* Tap-edge zones — invisible buttons, fullscreen only */}
      <button
        type="button"
        aria-label="Previous media"
        onClick={() => goTo(carouselSlide - 1)}
        className="absolute"
        style={{
          left: 0,
          top: 120,
          bottom: 220,
          width: '25%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          zIndex: 25,
          cursor: 'pointer',
        }}
      />
      <button
        type="button"
        aria-label="Next media"
        onClick={() => goTo(carouselSlide + 1)}
        className="absolute"
        style={{
          right: 0,
          top: 120,
          bottom: 220,
          width: '25%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          zIndex: 25,
          cursor: 'pointer',
        }}
      />
    </>
  );
};

export default FullscreenCarouselOverlay;
