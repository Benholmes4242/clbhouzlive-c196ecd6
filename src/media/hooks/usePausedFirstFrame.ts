/**
 * usePausedFirstFrame — Instagram/TikTok-style paused-first-frame primitive.
 *
 * Forces the video's first frame to paint while PAUSED, then plays/pauses
 * by `active`. iOS-safe via a layered strategy:
 *   1. seek to 0.001s (paints frame 1 on Chrome/Android, often iOS).
 *   2. if no paint within IOS_FALLBACK_MS, do a muted play→pause micro-cycle
 *      to force iOS to allocate a decoder and paint a frame.
 *
 * The video element should start with opacity:0 and reveal once
 * `hasFirstFrame` is true — no thumbnail layer needed.
 */
import { useEffect, useRef, useState } from 'react';

const SEEK_PRIME = 0.001;
const IOS_FALLBACK_MS = 250;

export function usePausedFirstFrame(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
) {
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const primedRef = useRef(false);
  const frameRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prime a painted frame while paused.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || primedRef.current) return;
    primedRef.current = true;
    frameRef.current = false;

    const markFrame = () => {
      if (frameRef.current) return;
      frameRef.current = true;
      setHasFirstFrame(true);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };

    const onSeeked = () => markFrame();
    const onLoadedData = () => {
      try {
        if (video.currentTime < SEEK_PRIME) video.currentTime = SEEK_PRIME;
      } catch {}
    };

    const v = video as any;
    if (typeof v.requestVideoFrameCallback === 'function') {
      v.requestVideoFrameCallback(() => markFrame());
    }
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadeddata', onLoadedData);

    // iOS fallback: micro muted play→pause to force decode.
    fallbackTimer.current = setTimeout(() => {
      if (frameRef.current) return;
      const wasMuted = video.muted;
      video.muted = true;
      video
        .play()
        .then(() => {
          requestAnimationFrame(() => {
            if (!active) {
              try { video.pause(); } catch {}
            }
            video.muted = wasMuted;
            markFrame();
          });
        })
        .catch(() => {
          video.muted = wasMuted;
        });
    }, IOS_FALLBACK_MS);

    return () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('loadeddata', onLoadedData);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [videoRef, active]);

  // Drive play/pause by `active`, WITHOUT re-attaching. Keep decoded when inactive.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.play().catch(() => {});
    } else {
      try { video.pause(); } catch {}
    }
  }, [active, videoRef]);

  const reset = () => {
    primedRef.current = false;
    frameRef.current = false;
    setHasFirstFrame(false);
  };
  return { hasFirstFrame, reset };
}
