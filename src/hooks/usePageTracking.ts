import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * `subtab` EARNS ITS PLACE (7 Sep 2026). Without it every arrival on Handicap
 * collapsed to `/handicap`, so the Form and Circle tabs had no denominator at
 * all: we could see 19 members open Handicap and 4 switch tab, and could not
 * tell how many ever reached Form — which is exactly the number needed to read
 * anything into the rounds archive being unopened. Deep links and the default
 * tab were both invisible. Keep this list to view-selecting params only; it
 * multiplies the distinct paths in analytics.
 */
const VIEW_PARAMS = ['tab', 'view', 'type', 'subtab'] as const;

function trackedPath(pathname: string, search: string): string {
  const sp = new URLSearchParams(search);
  const kept: string[] = [];
  for (const k of VIEW_PARAMS) {
    const v = sp.get(k);
    if (v && /^[A-Za-z0-9_-]{1,40}$/.test(v)) kept.push(`${k}=${v}`);
  }
  kept.sort();
  return kept.length ? `${pathname}?${kept.join('&')}` : pathname;
}

export function usePageTracking() {
  const location = useLocation();
  const enterTime = useRef(Date.now());
  const lastPath = useRef('');
  // Set when a hide-driven page_exit has been emitted, cleared when the
  // document becomes visible again. Stops pagehide and visibilitychange
  // double-counting the same hide.
  const exitedOnHide = useRef(false);

  useEffect(() => {
    const path = trackedPath(location.pathname, location.search);

    // Track time spent on previous page
    if (lastPath.current && lastPath.current !== path) {
      const durationSec = Math.round((Date.now() - enterTime.current) / 1000);
      analyticsEvents.track('page_exit', {
        path: lastPath.current,
        duration_sec: durationSec,
      });
    }

    // Track new page view
    analyticsEvents.track('page_view', { path });
    enterTime.current = Date.now();
    lastPath.current = path;
    // A fresh route counts as a fresh foreground session for this screen.
    exitedOnHide.current = false;
  }, [trackedPath(location.pathname, location.search)]);

  // Page hide coverage: without this, page_exit never fires when the member
  // closes the tab, backgrounds the app, or leaves the site, which biases
  // dwell against the stickiest screens.
  useEffect(() => {
    const emitHideExit = () => {
      if (exitedOnHide.current) return;
      if (!lastPath.current) return;
      exitedOnHide.current = true;
      const durationSec = Math.round((Date.now() - enterTime.current) / 1000);
      analyticsEvents.track('page_exit', {
        path: lastPath.current,
        duration_sec: durationSec,
      });
      // Reset so the hidden period is never counted into a later exit.
      enterTime.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        emitHideExit();
        return;
      }
      // Back in the foreground on the same path: measure only foreground time
      // from here. Deliberately no page_view, so views stay comparable with
      // historical data.
      exitedOnHide.current = false;
      enterTime.current = Date.now();
    };

    // Safari and iOS do not reliably fire visibilitychange on tab close.
    const onPageHide = () => {
      emitHideExit();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);
}
