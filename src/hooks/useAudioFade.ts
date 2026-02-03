/**
 * useAudioFade - Smooth audio volume transitions
 * 
 * FIX #10: Implements smooth 150ms volume fade instead of abrupt mute/unmute.
 * Uses requestAnimationFrame for butter-smooth transitions.
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
  /** Fade out from current volume to 0 */
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

  const cancel = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isFadingRef.current = false;
  }, []);

  const fadeIn = useCallback((video: HTMLVideoElement, targetVolume: number = 1): Promise<void> => {
    return new Promise((resolve) => {
      cancel(); // Cancel any existing fade
      
      if (!video) {
        resolve();
        return;
      }

      // Unmute first, then fade volume
      video.muted = false;
      const startVolume = 0;
      video.volume = startVolume;
      
      const startTime = performance.now();
      isFadingRef.current = true;
      
      const animate = (currentTime: number) => {
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

  const fadeOut = useCallback((video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve) => {
      cancel(); // Cancel any existing fade
      
      if (!video) {
        resolve();
        return;
      }

      const startVolume = video.volume;
      const targetVolume = 0;
      
      // If already at 0, just mute and resolve
      if (startVolume <= 0.01) {
        video.muted = true;
        video.volume = 0;
        resolve();
        return;
      }
      
      const startTime = performance.now();
      isFadingRef.current = true;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easings[easing](progress);
        
        video.volume = startVolume - (startVolume - targetVolume) * easedProgress;
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          video.volume = 0;
          video.muted = true; // Mute after fade completes
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
 * Standalone fade functions for use outside React components
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

    video.muted = false;
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
      video.muted = true;
      video.volume = 0;
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
        video.muted = true;
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};
