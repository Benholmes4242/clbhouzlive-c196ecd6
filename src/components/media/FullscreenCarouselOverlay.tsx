/**
 * FullscreenCarouselOverlay — segmented dots for fullscreen viewers.
 *
 * Used by the fullscreen viewer (gallery mode included). Reads the active
 * post's media count and current carousel slide from the global Clubhouse
 * store. Tap-to-advance and swipe gestures are owned by FeedImageCarousel —
 * this overlay no longer renders edge buttons so it cannot swallow gestures
 * on the left/right quarters of the screen.
 *
 * Returns null for single-media posts.
 */
import React from 'react';
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

  if (!activePost || count <= 1) return null;

  return (
    <div
      className="absolute pointer-events-none flex justify-center"
      style={{
        top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
        left: 0,
        right: 0,
        zIndex: 9029,
      }}
    >
      <CarouselDots
        count={count}
        active={carouselSlide}
        variant="windowed"
        isVisible={isVisible}
      />
    </div>
  );
};

export default FullscreenCarouselOverlay;
