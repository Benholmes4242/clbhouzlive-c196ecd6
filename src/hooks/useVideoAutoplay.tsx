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
    rootMargin = '0px' // Remove delay, immediate autoplay
  } = options;

  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  // Use intersection observer for scroll-based autoplay
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  // Update autoplay state based on visibility only, but don't change it once set to true
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    // Only set to true when in view, don't toggle back to false to prevent restarts
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