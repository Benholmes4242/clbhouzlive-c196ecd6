import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * page_view keeps only tab/view/type params (see usePageTracking), so the
 * ?src=nudge_* marker on onboarding nudge deep links would otherwise be lost.
 * This fires one `onboarding_nudge_opened` event per arrival, carrying the gap,
 * which is what ties a nudge to the setup step being finished.
 */
const NUDGE_SRC = /^nudge_(whs|club|username)$/;

export function useNudgeArrival(): void {
  const location = useLocation();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const src = new URLSearchParams(location.search).get('src');
    if (!src || !NUDGE_SRC.test(src)) return;
    const key = `${location.pathname}?${src}`;
    if (seen.current === key) return;
    seen.current = key;
    analyticsEvents.track('onboarding_nudge_opened', {
      gap: src.replace('nudge_', ''),
      path: location.pathname,
    });
  }, [location.pathname, location.search]);
}
