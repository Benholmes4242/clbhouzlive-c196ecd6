/**
 * useAudioFade - Smooth audio volume transitions
 * 
 * MUTE ARCHITECTURE FIX: This hook ONLY manipulates video.volume, NEVER video.muted.
 * The .muted property is exclusively controlled by GlobalAudioContext → UnifiedVideoPlayer's
 * useEffect sync. This prevents drift between DOM state and React state.
 */

import { useCallback, useRef } from 'react';

interface UseAudioFadeOptions {
  /** Fade duration in milliseconds (default: 150ms) */
  duration?: number;
  /** Easing function - 'linear' | 'easeOut' | 'easeInOut' */
  easing?: 'linear' | 'easeOut' | 'easeInOut';
}

interface AudioFadeControls {
  /** Fade in from 0 to target volume */
  fadeIn: (video: HTMLVideoElement, targetVolume?: number) => Promise<void>;
  /** Fade out from current volume to 0, then pause */
  fadeOut: (video: HTMLVideoElement) => Promise<void>;
  /** Cancel any ongoing fade */
  cancel: () => void;
  /** Check if fade is in progress */
  isFading: () => boolean;
}

// Easing functions
const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export const useAudioFade = (options: UseAudioFadeOptions = {}): AudioFadeControls => {
  const { duration = 150, easing = 'easeOut' } = options;
  
  const animationFrameRef = useRef<number | null>(null);
  const isFadingRef = useRef(false);
  // Cancellation flag checked on every rAF frame to stop mid-fade overrides
  const cancelledRef = useRef(false);

  const cancel = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    cancelledRef.current = true;
    isFadingRef.current = false;
  }, []);

  /**
   * Fade volume from 0 → targetVolume.
   * IMPORTANT: Does NOT touch video.muted — that is GlobalAudioContext's responsibility.
   * Caller should ensure video.muted = false BEFORE calling fadeIn (done by the mute sync effect).
   */
  const fadeIn = useCallback((video: HTMLVideoElement, targetVolume: number = 1): Promise<void> => {
    return new Promise((resolve) => {
      cancel(); // Cancel any existing fade
      cancelledRef.current = false;
      
      if (!video) {
        resolve();
        return;
      }

      // Only manipulate volume — never .muted
      const startVolume = 0;
      video.volume = startVolume;
      
      const startTime = performance.now();
      isFadingRef.current = true;
      
      const animate = (currentTime: number) => {
        // Check cancellation on every frame — prevents stale rAF overriding a new user tap
        if (cancelledRef.current) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easings[easing](progress);
        
        video.volume = startVolume + (targetVolume - startVolume) * easedProgress;
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          video.volume = targetVolume;
          isFadingRef.current = false;
          animationFrameRef.current = null;
          resolve();
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [duration, easing, cancel]);

  /**
   * Fade volume from current → 0, then pause the video.
   * IMPORTANT: Does NOT set video.muted = true — that is GlobalAudioContext's responsibility.
   * Pausing the video (rather than muting) is the correct scroll-away behaviour:
   * it silences audio without lying to the global mute state.
   */
  const fadeOut = useCallback((video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve) => {
      cancel(); // Cancel any existing fade
      cancelledRef.current = false;
      
      if (!video) {
        resolve();
        return;
      }

      const startVolume = video.volume;
      
      // If already silent, just pause and resolve — no need to animate
      if (startVolume <= 0.01) {
        video.pause();
        resolve();
        return;
      }
      
      const startTime = performance.now();
      isFadingRef.current = true;
      
      const animate = (currentTime: number) => {
        // Check cancellation on every frame
        if (cancelledRef.current) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easings[easing](progress);
        
        video.volume = startVolume - (startVolume - 0) * easedProgress;
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          video.volume = 0;
          // Pause instead of muting — keeps DOM .muted in sync with GlobalAudioContext
          video.pause();
          isFadingRef.current = false;
          animationFrameRef.current = null;
          resolve();
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [duration, easing, cancel]);

  const isFading = useCallback(() => isFadingRef.current, []);

  return {
    fadeIn,
    fadeOut,
    cancel,
    isFading,
  };
};

/**
 * Standalone fade functions for use outside React components.
 * Same contract: only manipulate .volume, never .muted.
 */
export const audioFadeIn = (
  video: HTMLVideoElement, 
  targetVolume: number = 1, 
  duration: number = 150
): Promise<void> => {
  return new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }

    // Do NOT set video.muted = false here — GlobalAudioContext owns that
    video.volume = 0;
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easings.easeOut(progress);
      
      video.volume = targetVolume * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        video.volume = targetVolume;
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

export const audioFadeOut = (
  video: HTMLVideoElement, 
  duration: number = 150
): Promise<void> => {
  return new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }

    const startVolume = video.volume;
    
    if (startVolume <= 0.01) {
      // Already silent — just pause, don't touch .muted
      video.pause();
      resolve();
      return;
    }
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easings.easeOut(progress);
      
      video.volume = startVolume * (1 - easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        video.volume = 0;
        // Pause instead of muting — keeps DOM .muted in sync with GlobalAudioContext
        video.pause();
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};
