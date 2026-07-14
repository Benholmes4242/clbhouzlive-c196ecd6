/**
 * Phase 1 Perf: Scroll restoration for better UX on back navigation
 * Restores scroll position when returning to a list/feed
 */

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getPageScrollTop, getPrimaryScrollElement, scrollPageTo, scrollPageToTop } from '@/lib/getScrollParent';

export const scrollPositions = new Map<string, number>();

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Save current scroll position before leaving
  useEffect(() => {
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    
    return () => {
      if (!isCourseDetail) {
        const currentPath = location.pathname + location.search;
        scrollPositions.set(currentPath, getPageScrollTop());
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
          const pageHeight = getPrimaryScrollElement()?.scrollHeight ?? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          if (pageHeight > savedPosition) {
            scrollPageTo(savedPosition, 'instant');
          } else {
            requestAnimationFrame(() => {
              scrollPageTo(savedPosition, 'instant');
            });
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // PUSH or REPLACE — clear stale position and scroll to top
      scrollPositions.delete(currentPath);
      scrollPageToTop('instant');
    }
  }, [location, navigationType]);

  return null;
};
