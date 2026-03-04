import { useEffect, useRef } from 'react';
import { TIMING } from '../types/media';

const LOG_THROTTLE_MS = 1000;

/**
 * RAF-based gapless loop: seeks back to 0 before the video reaches its end,
 * eliminating the black-frame flash caused by the native `ended` event.
 *
 * Stops the RAF loop when the video is paused to save CPU. Re-arms via
 * the `play` event.
 */
export function useGaplessLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  duration: number | null
) {
  const rafIdRef = useRef<number | null>(null);
  const isLoopingRef = useRef(false);
  const lastLogRef = useRef(0);

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

    function startLoop() {
      function checkLoop() {
        if (!video || isLoopingRef.current) {
          rafIdRef.current = requestAnimationFrame(checkLoop);
          return;
        }

        // If paused or ended, stop the RAF loop. The 'play' listener re-arms it.
        if (video.paused || video.ended) {
          rafIdRef.current = null;
          return;
        }

        const remaining = duration! - video.currentTime;

        // Throttled debug log
        const now = Date.now();
        if (now - lastLogRef.current > LOG_THROTTLE_MS) {
          console.log('[GaplessLoop] RAF active, remaining:', remaining.toFixed(2));
          lastLogRef.current = now;
        }

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
    }

    // Start immediately if playing
    if (!video.paused) startLoop();

    // Re-arm on play event
    const onPlay = () => {
      if (!rafIdRef.current) startLoop();
    };

    video.addEventListener('play', onPlay);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      video.removeEventListener('play', onPlay);
    };
  }, [isActive, duration, videoRef]);
}
