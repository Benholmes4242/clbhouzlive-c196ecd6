import { useEffect, useState, RefObject } from 'react';

/**
 * Guards against autoplay policy blocking by attempting playback
 * and gracefully handling NotAllowedError. Re-attempts on user interaction.
 */
export function useAutoplayGuard(
  videoRef: RefObject<HTMLVideoElement>,
  enabled: boolean
) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If disabled, pause the video immediately
    if (!enabled) {
      try {
        video.pause();
      } catch (e) {
        // Silently fail if pause is not supported
      }
      setBlocked(false);
      return;
    }

    // Try to play when enabled
    const tryPlay = async () => {
      try {
        await video.play();
        setBlocked(false);
      } catch (err) {
        // NotAllowedError or other autoplay policy block
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setBlocked(true);
        }
      }
    };

    tryPlay();

    // Re-attempt on first user interaction if blocked
    const onUserInteract = () => {
      if (blocked) {
        tryPlay();
      }
    };

    // Pause on page hide (tab switch, background)
    const onVisibilityChange = () => {
      if (document.hidden) {
        try {
          video.pause();
        } catch (e) {
          // Silently fail
        }
      }
    };

    window.addEventListener('pointerdown', onUserInteract, { once: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    return () => {
      window.removeEventListener('pointerdown', onUserInteract);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [videoRef, enabled, blocked]);

  return blocked;
}
