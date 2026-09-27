import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * page_view keeps only tab/view/type params (see usePageTracking), so the
 * ?src=nudge_* marker on onboarding nudge deep links would otherwise be lost.
 * This fires one `onboarding_nudge_opened` event per arrival, carrying the gap,
 * which is what ties a nudge to the setup step being finished.
 *
 * REDIRECT-PROOF: a nudge arrival is one event about one marker, not one per
 * path it passes through. The dedupe key is the src value alone (for the
 * lifetime of the mount), and the fire is deferred one macrotask and cancelled
 * by any further location change, so a <Navigate replace> hop that preserves
 * ?src reports only the path the member LANDED on, never the intermediate.
 * The marker is deliberately left in the URL (passive hook).
 */
const NUDGE_SRC = /^nudge_(whs|club|username)$/;

export function useNudgeArrival(): void {
  const location = useLocation();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const src = new URLSearchParams(location.search).get('src');
    if (!src || !NUDGE_SRC.test(src) || seen.current.has(src)) return;
    const path = location.pathname;
    const timer = window.setTimeout(() => {
      if (seen.current.has(src)) return;
      seen.current.add(src);
      analyticsEvents.track('onboarding_nudge_opened', {
        gap: src.replace('nudge_', ''),
        path,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);
}
