/**
 * GaplessLoop - Eliminates the black frame gap when videos loop
 * 
 * The standard HTML5 loop attribute causes a brief visual discontinuity
 * at the loop point because the browser must seek back to 0 and decode.
 * 
 * This utility creates a seamless loop by:
 * 1. Monitoring playback position near the end
 * 2. Seeking back slightly before the actual end (1-2 frames overlap)
 * 3. Using requestAnimationFrame for precise timing
 * 
 * Instagram and TikTok use similar techniques for their infinite video loops.
 */

import { useEffect, useRef } from 'react';

interface GaplessLoopConfig {
  // How far from the end to trigger the loop (in seconds)
  // 0.15 = 150ms before end, roughly 4-5 frames at 30fps
  loopThreshold?: number;
  
  // Whether to enable debug logging
  debug?: boolean;
}

interface GaplessLoopInstance {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

export function createGaplessLoop(
  video: HTMLVideoElement,
  config: GaplessLoopConfig = {}
): GaplessLoopInstance {
  const { loopThreshold = 0.15, debug = false } = config;
  
  let rafId: number | null = null;
  let isActive = false;
  let lastLoopTime = 0;
  
  // Minimum time between loops to prevent rapid-fire on short videos
  const MIN_LOOP_INTERVAL_MS = 100;

  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[GaplessLoop] ${message}`, data ?? '');
    }
  };

  const checkLoop = () => {
    if (!isActive || !video || video.paused || video.ended) {
      rafId = null;
      return;
    }

    const duration = video.duration;
    const currentTime = video.currentTime;

    // Check if we're near the end
    if (
      duration > 0 &&
      currentTime > 0 &&
      duration - currentTime <= loopThreshold
    ) {
      const now = performance.now();
      
      // Prevent rapid-fire loops
      if (now - lastLoopTime > MIN_LOOP_INTERVAL_MS) {
        log('Triggering gapless loop', {
          currentTime: currentTime.toFixed(3),
          duration: duration.toFixed(3),
          gap: (duration - currentTime).toFixed(3),
        });
        
        lastLoopTime = now;
        
        // Seek to just after the start to avoid any start-of-file decode issues
        // 0.001 is essentially frame 1
        video.currentTime = 0.001;
      }
    }

    // Continue monitoring
    rafId = requestAnimationFrame(checkLoop);
  };

  const handlePlay = () => {
    if (isActive && rafId === null) {
      rafId = requestAnimationFrame(checkLoop);
    }
  };

  const handlePause = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const start = () => {
    if (isActive) return;
    
    isActive = true;
    
    // Disable native loop to prevent double-looping
    video.loop = false;
    
    log('Started gapless loop monitoring');
    
    // Start the RAF loop
    rafId = requestAnimationFrame(checkLoop);
    
    // Also listen for play events to restart monitoring
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
  };

  const stop = () => {
    isActive = false;
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    log('Stopped gapless loop monitoring');
  };

  const destroy = () => {
    stop();
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    log('Destroyed gapless loop instance');
  };

  return {
    start,
    stop,
    destroy,
  };
}

/**
 * React hook for gapless looping
 */
export function useGaplessLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean = true,
  debug: boolean = false
) {
  const loopInstanceRef = useRef<GaplessLoopInstance | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) {
      return;
    }

    // Create the gapless loop instance
    loopInstanceRef.current = createGaplessLoop(video, { debug });
    loopInstanceRef.current.start();

    return () => {
      if (loopInstanceRef.current) {
        loopInstanceRef.current.destroy();
        loopInstanceRef.current = null;
      }
    };
  }, [videoRef, enabled, debug]);

  return loopInstanceRef;
}
