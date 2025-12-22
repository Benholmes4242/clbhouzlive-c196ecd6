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
    if (!video || !enabled) {
      setBlocked(false);
      return;
    }

    // PLAYBACK_AUTHORITY_ALLOWED: Autoplay policy detection must test raw play()
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

    window.addEventListener('pointerdown', onUserInteract, { once: true });
    
    return () => {
      window.removeEventListener('pointerdown', onUserInteract);
    };
  }, [videoRef, enabled, blocked]);

  return blocked;
}
