import { useEffect, useState, useRef, RefObject } from 'react';

/**
 * Guards against autoplay policy blocking by attempting playback
 * and gracefully handling NotAllowedError. Re-attempts on ANY user interaction.
 * 
 * iOS WebView is particularly strict - newly created video elements don't inherit
 * user gesture permission, so we need to listen for touch/click/scroll events
 * and retry playback when they occur.
 */
export function useAutoplayGuard(
  videoRef: RefObject<HTMLVideoElement>,
  enabled: boolean
) {
  const [blocked, setBlocked] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) {
      setBlocked(false);
      retryCountRef.current = 0;
      return;
    }

    // PLAYBACK_AUTHORITY_ALLOWED: Autoplay policy detection must test raw play()
    const tryPlay = async (): Promise<boolean> => {
      try {
        // Ensure muted before attempting (iOS requirement)
        video.muted = true;
        await video.play();
        setBlocked(false);
        retryCountRef.current = 0;
        return true;
      } catch (err) {
        // NotAllowedError or other autoplay policy block
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setBlocked(true);
          return false;
        }
        return false;
      }
    };

    tryPlay();

    // Re-attempt on ANY user interaction if blocked
    // iOS WebView requires fresh user gesture for newly mounted video elements
    const onUserInteract = () => {
      if (retryCountRef.current >= maxRetries) return;
      
      const video = videoRef.current;
      if (!video || video.paused === false) return; // Already playing
      
      retryCountRef.current++;
      tryPlay();
    };

    // Listen to multiple interaction types for iOS WebView compatibility
    const interactionEvents = ['touchstart', 'touchend', 'pointerdown', 'click', 'scroll'];
    
    interactionEvents.forEach(event => {
      window.addEventListener(event, onUserInteract, { passive: true });
    });
    
    return () => {
      interactionEvents.forEach(event => {
        window.removeEventListener(event, onUserInteract);
      });
    };
  }, [videoRef, enabled]);

  return blocked;
}
