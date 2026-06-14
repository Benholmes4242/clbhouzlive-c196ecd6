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
  attachToken: number = 0,
) {
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const frameRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);

  // Keep activeRef current without retriggering the prime effect.
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Prime a painted frame while paused.
  // Re-arms on every attachToken bump so re-attaches (e.g. scroll-up after
  // radius teardown) re-paint the first frame BEFORE activation, independent
  // of the play()→'playing' roundtrip. `active` flips MUST NOT be in deps —
  // they would tear down the reveal listeners + iOS fallback timer mid-prime.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Clear prior frame state for the new source.
    frameRef.current = false;
    setHasFirstFrame(false);

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
    const onPlaying = () => markFrame();
    const onCanPlay = () => {
      markFrame();
      // Belt-and-braces: if active but still paused when the element becomes
      // playable, start playback. Closes the play/attach race from the other side.
      if (activeRef.current && video.paused) {
        video.play().catch(() => {});
      }
    };

    const v = video as any;
    if (typeof v.requestVideoFrameCallback === 'function') {
      v.requestVideoFrameCallback(() => markFrame());
    }
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);

    // iOS fallback: micro muted play→pause to force decode.
    // Gated to active cards only — inactive neighbours must NOT force-play
    // (iOS has a single inline-video decoder; neighbours would steal it).
    fallbackTimer.current = setTimeout(() => {
      if (frameRef.current) return;
      if (!activeRef.current) return;
      const wasMuted = video.muted;
      video.muted = true;
      video
        .play()
        .then(() => {
          requestAnimationFrame(() => {
            if (!activeRef.current) {
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
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [videoRef, attachToken]);

  // Drive play/pause by `active`, WITHOUT re-attaching. Keep decoded when inactive.
  // Safety net: if play() resolves, force the tile visible — opacity:0 while
  // playing is never correct.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video
        .play()
        .then(() => {
          frameRef.current = true;
          setHasFirstFrame(true);
        })
        .catch(() => {});
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
