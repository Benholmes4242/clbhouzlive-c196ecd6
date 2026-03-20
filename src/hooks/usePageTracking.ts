import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function usePageTracking() {
  const location = useLocation();
  const enterTime = useRef(Date.now());
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname;

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
  }, [location.pathname]);
}
