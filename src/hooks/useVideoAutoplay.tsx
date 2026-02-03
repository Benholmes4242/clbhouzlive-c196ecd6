/**
 * useVideoAutoplay - Scroll-based video autoplay with hysteresis
 * 
 * FIX #8: Uses hysteresis (50% enter, 10% exit) to prevent autoplay flicker
 * when videos are near the visibility threshold boundary.
 */

import { useState, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseVideoAutoplayOptions {
  enabled?: boolean;
  /** Visibility threshold to START playing (default: 0.5 = 50%) */
  threshold?: number;
  /** Visibility threshold to STOP playing (default: 0.1 = 10%) - creates hysteresis buffer */
  exitThreshold?: number;
  rootMargin?: string;
}

export const useVideoAutoplay = (options: UseVideoAutoplayOptions = {}) => {
  const {
    enabled = true,
    threshold = 0.5, // 50% visibility to START playing
    exitThreshold = 0.1, // 10% visibility to STOP - hysteresis prevents flicker
    rootMargin = '300px' // Preload when within 300px of viewport
  } = options;

  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  // FIX #8: Use intersection observer with hysteresis enabled
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold,
    exitThreshold,
    rootMargin,
    hysteresis: true, // Enable hysteresis for smooth autoplay transitions
  });

  // Update autoplay state based on visibility - immediate autoplay without delay
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    // FIX #8: Direct sync with isInView (hysteresis is handled in the observer)
    setShouldAutoplay(isInView);
  }, [enabled, isInView]);

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