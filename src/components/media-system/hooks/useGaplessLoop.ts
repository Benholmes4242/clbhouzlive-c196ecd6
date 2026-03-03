import { useEffect, useRef } from 'react';
import { TIMING } from '../types/media';

/**
 * RAF-based gapless loop: seeks back to 0 before the video reaches its end,
 * eliminating the black-frame flash caused by the native `ended` event.
 *
 * The safety `ended` listener in the pool manager acts as a fallback only.
 */
export function useGaplessLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  duration: number | null
) {
  const rafIdRef = useRef<number | null>(null);
  const isLoopingRef = useRef(false);

  useEffect(() => {
    if (!isActive || !videoRef.current || !duration || duration <= 0) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      return;
    }

    const video = videoRef.current;
    const threshold =
      duration < TIMING.SHORT_VIDEO_S
        ? TIMING.LOOP_THRESHOLD_SHORT_S
        : TIMING.LOOP_THRESHOLD_S;

    function checkLoop() {
      if (!video || video.paused || video.ended || isLoopingRef.current) {
        rafIdRef.current = requestAnimationFrame(checkLoop);
        return;
      }

      const remaining = duration! - video.currentTime;

      if (remaining <= threshold && remaining > 0) {
        isLoopingRef.current = true;
        video.currentTime = 0;
        // Microtask barrier to prevent double-seek
        Promise.resolve().then(() => {
          isLoopingRef.current = false;
        });
      }

      rafIdRef.current = requestAnimationFrame(checkLoop);
    }

    rafIdRef.current = requestAnimationFrame(checkLoop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [isActive, duration, videoRef]);
}
