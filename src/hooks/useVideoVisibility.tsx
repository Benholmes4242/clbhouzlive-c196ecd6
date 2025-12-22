/**
 * useVideoVisibility - DEPRECATED STUB
 * 
 * ⚠️ RETIRE ME: This hook has been retired. MediaRuntime is now the single playback authority.
 * This stub exists only for backward compatibility during migration.
 * Components should use useMediaAutoplay or HLSPlayer's built-in autoplay.
 * 
 * TODO: Delete this file entirely once all consumers have migrated.
 */
import { useRef, useState, useEffect } from 'react';
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

// DEV warning - shown once per session
let warned = false;

export function useVideoVisibility(options: UseVideoVisibilityOptions = {}) {
  useEffect(() => {
    if (import.meta.env.DEV && !warned) {
      warned = true;
      console.warn(
        '⚠️ RETIRE ME: useVideoVisibility() is deprecated.\n' +
        'Use useMediaAutoplay or HLSPlayer autoplay instead.\n' +
        'This hook will be deleted in the next PR.'
      );
    }
  }, []);

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
