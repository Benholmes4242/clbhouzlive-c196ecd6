/**
 * useVideoVisibility - DEPRECATED STUB
 * 
 * ⚠️ RETIRE ME: This hook has been retired. MediaRuntime is now the single playback authority.
 * This stub exists only for backward compatibility during migration.
 * Components should use useMediaAutoplay or HLSPlayer's built-in autoplay.
 */
import { useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface UseVideoVisibilityOptions {
  threshold?: number;
  rootMargin?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  shouldAutoplay?: boolean;
  globallyMuted?: boolean;
  onEnterView?: () => void;
  onExitView?: () => void;
}

export function useVideoVisibility(options: UseVideoVisibilityOptions = {}) {
  const { threshold = 0.5, rootMargin = '0px' } = options;
  
  // Use standard intersection observer for visibility detection only
  // NO PLAYBACK CONTROL - that's MediaRuntime's job
  const { ref: containerRef, isInView: isVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
  });
  
  // "Near" detection for preloading (larger margin)
  const isNear = isVisible; // Simplified - always treat visible as near
  
  return {
    containerRef,
    isVisible,
    isNear,
  };
}
