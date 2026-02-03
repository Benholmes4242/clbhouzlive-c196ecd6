/**
 * useBufferingIndicator - Debounced buffering state for smooth UX
 * 
 * Prevents flickering by:
 * 1. Delay showing spinner (200ms) - avoids flash for quick buffers
 * 2. Minimum display time (400ms) - prevents jarring quick hide
 * 3. Tracks actual video waiting/playing events
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseBufferingIndicatorOptions {
  /** Delay before showing spinner (ms) */
  showDelay?: number;
  /** Minimum time spinner stays visible once shown (ms) */
  minDisplayTime?: number;
}

interface BufferingState {
  /** Whether to show the buffering indicator */
  showBuffering: boolean;
  /** Raw buffering state without debounce */
  isBuffering: boolean;
}

export function useBufferingIndicator(
  videoElement: HTMLVideoElement | null,
  options: UseBufferingIndicatorOptions = {}
): BufferingState {
  const { showDelay = 200, minDisplayTime = 400 } = options;
  
  const [isBuffering, setIsBuffering] = useState(false);
  const [showBuffering, setShowBuffering] = useState(false);
  
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number>(0);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Handle buffering state changes with debounce
  useEffect(() => {
    if (isBuffering) {
      // Start buffering - delay showing indicator
      showTimeoutRef.current = setTimeout(() => {
        setShowBuffering(true);
        shownAtRef.current = Date.now();
      }, showDelay);
    } else {
      // Stop buffering - respect minimum display time
      clearTimeouts();
      
      if (shownAtRef.current > 0) {
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        if (remaining > 0) {
          hideTimeoutRef.current = setTimeout(() => {
            setShowBuffering(false);
            shownAtRef.current = 0;
          }, remaining);
        } else {
          setShowBuffering(false);
          shownAtRef.current = 0;
        }
      } else {
        setShowBuffering(false);
      }
    }

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, [isBuffering, showDelay, minDisplayTime, clearTimeouts]);

  // Listen to video events
  useEffect(() => {
    if (!videoElement) return;

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);
    const handleSeeked = () => setIsBuffering(false);
    const handleError = () => setIsBuffering(false);

    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('seeked', handleSeeked);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('seeked', handleSeeked);
      videoElement.removeEventListener('error', handleError);
      clearTimeouts();
    };
  }, [videoElement, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return { showBuffering, isBuffering };
}

export default useBufferingIndicator;
