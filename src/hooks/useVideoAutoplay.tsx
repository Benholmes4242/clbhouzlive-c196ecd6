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
    threshold = 0.6, // Changed to 60% visibility for better UX
    rootMargin = '0px'
  } = options;

  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  // Use intersection observer for scroll-based autoplay
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  // Update autoplay state based on hover and visibility
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    if (isMobile) {
      // Mobile: autoplay when scrolled into view
      setShouldAutoplay(isInView);
    } else {
      // Desktop: autoplay on hover AND when in view
      setShouldAutoplay(isHovered && isInView);
    }
  }, [enabled, isMobile, isHovered, isInView]);

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