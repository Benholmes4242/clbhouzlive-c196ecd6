import { useEffect, useRef, useState, useCallback } from 'react';

const SHOWS_KEY = 'discover_swipe_tutorial_v1_shows';
const DISMISSES_KEY = 'discover_swipe_tutorial_v1_dismisses';
const MAX_SHOWS = 3;

export function useDiscoverOnboarding(isMobile: boolean, autoHideMs = 5000) {
  const [show, setShow] = useState(false);
  const autoHideTimer = useRef<number | null>(null);
  const countedThisSession = useRef(false); // prevent double-counting

  // count a "show" (not a dismiss). called once per session when overlay becomes visible.
  const countShown = () => {
    if (countedThisSession.current) return;
    countedThisSession.current = true;
    try {
      const shows = Number(localStorage.getItem(SHOWS_KEY) || '0');
      localStorage.setItem(SHOWS_KEY, String(Math.min(shows + 1, MAX_SHOWS)));
    } catch {}
  };

  // user actively dismisses (Got it / first swipe)
  const dismiss = useCallback((reason: 'got_it' | 'swiped') => {
    // record a dismiss (optional analytics)
    try {
      const dis = Number(localStorage.getItem(DISMISSES_KEY) || '0');
      localStorage.setItem(DISMISSES_KEY, String(dis + 1));
    } catch {}
    // clear timer & hide
    if (autoHideTimer.current) window.clearTimeout(autoHideTimer.current);
    setShow(false);
    // gtag?.('event', 'discover_swipe_tutorial_dismiss', { reason });
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    // show if we've shown less than MAX_SHOWS
    const shows = Number(localStorage.getItem(SHOWS_KEY) || '0');
    if (shows < MAX_SHOWS) {
      setShow(true);
    }
  }, [isMobile]);

  // start auto-hide + count "shown" only when visible
  useEffect(() => {
    if (!show) return;
    countShown();
  // Temporarily disabled auto-hide for testing
  // if (autoHideTimer.current) window.clearTimeout(autoHideTimer.current);
  // autoHideTimer.current = window.setTimeout(() => {
  //   setShow(false); // auto-fade hides, but does NOT increment "dismisses"
  // }, autoHideMs);

    return () => {
      if (autoHideTimer.current) window.clearTimeout(autoHideTimer.current);
    };
  }, [show, autoHideMs]);

  return { show, dismiss };
}