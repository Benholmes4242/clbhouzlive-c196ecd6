/**
 * Phase 1 Perf: Scroll restoration for better UX on back navigation
 * Restores scroll position when returning to a list/feed
 */

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Save current scroll position before leaving
  useEffect(() => {
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    
    return () => {
      if (!isCourseDetail) {
        const currentPath = location.pathname + location.search;
        scrollPositions.set(currentPath, window.scrollY);
      }
    };
  }, [location]);

  // Restore or reset scroll based on navigation type
  useEffect(() => {
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    if (isCourseDetail) return;

    const currentPath = location.pathname + location.search;

    if (navigationType === 'POP') {
      // Back/forward — restore saved position
      const savedPosition = scrollPositions.get(currentPath);
      if (savedPosition !== undefined) {
        const timeoutId = setTimeout(() => {
          if (document.body.scrollHeight > savedPosition) {
            window.scrollTo({ top: savedPosition, behavior: 'instant' });
          } else {
            requestAnimationFrame(() => {
              window.scrollTo({ top: savedPosition, behavior: 'instant' });
            });
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // PUSH or REPLACE — clear stale position and scroll to top
      scrollPositions.delete(currentPath);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location, navigationType]);

  return null;
};
