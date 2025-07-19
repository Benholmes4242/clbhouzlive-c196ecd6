import { useState, useEffect, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useIsMobile } from './use-mobile';

interface UseVideoAutoplayOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useVideoAutoplay = (options: UseVideoAutoplayOptions = {}) => {
  const {
    enabled = true,
    threshold = 0.5, // 50% visibility as requested
    rootMargin = '300px' // Preload when within 300px of viewport
  } = options;

  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  // Use intersection observer for scroll-based autoplay
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  // Update autoplay state based on visibility only (removed hover requirement for desktop)
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    // Only start autoplay when coming into view, don't restart when leaving
    if (isInView && !shouldAutoplay) {
      setShouldAutoplay(true);
    }
    // Keep playing even when out of view unless explicitly disabled
  }, [enabled, isInView, shouldAutoplay]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  return {
    ref: observerRef,
    shouldAutoplay,
    isInView,
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    isMobile
  };
};