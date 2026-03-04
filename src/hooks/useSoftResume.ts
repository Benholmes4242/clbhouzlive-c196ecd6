import { useCallback, useRef } from 'react';
import { MOTION_MED } from '@/lib/motionTokens';

/**
 * Hook for smooth audio resume with volume ramp
 * Used when resuming video after comments close
 */
export function useSoftResume() {
  const rampAnimationRef = useRef<number | null>(null);

  const softResume = useCallback((videoElement: HTMLVideoElement | null, isMuted: boolean) => {
    if (!videoElement || isMuted) {
      // If globally muted, just play without volume ramp
      videoElement?.play().catch(() => {});
      return;
    }

    // Cancel any existing ramp
    if (rampAnimationRef.current) {
      cancelAnimationFrame(rampAnimationRef.current);
    }

    // Start with volume at 0
    videoElement.volume = 0;
    videoElement.play().catch(() => {});

    // Ramp volume to 1 over ~250ms
    const startTime = performance.now();
    const duration = MOTION_MED + 50; // ~250ms

    const ramp = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out curve for smoother feel
      const eased = 1 - Math.pow(1 - progress, 2);
      videoElement.volume = eased;

      if (progress < 1) {
        rampAnimationRef.current = requestAnimationFrame(ramp);
      } else {
        rampAnimationRef.current = null;
      }
    };

    rampAnimationRef.current = requestAnimationFrame(ramp);
  }, []);

  const cancelRamp = useCallback(() => {
    if (rampAnimationRef.current) {
      cancelAnimationFrame(rampAnimationRef.current);
      rampAnimationRef.current = null;
    }
  }, []);

  return { softResume, cancelRamp };
}
