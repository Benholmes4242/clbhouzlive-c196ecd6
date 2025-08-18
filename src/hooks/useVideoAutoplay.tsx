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
    threshold = 0.7, // 70% visibility for autoplay as requested
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

  // Update autoplay state based on visibility - immediate autoplay without delay
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    // Immediate autoplay when in view
    if (isInView && !shouldAutoplay) {
      setShouldAutoplay(true);
    }
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