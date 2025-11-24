/**
 * Phase 1 Perf: Scroll restoration for better UX on back navigation
 * Restores scroll position when returning to a list/feed
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Exclude course detail routes from scroll restoration
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    
    // Save current scroll position before leaving (only for non-course-detail routes)
    return () => {
      if (!isCourseDetail) {
        const currentPath = location.pathname + location.search;
        scrollPositions.set(currentPath, window.scrollY);
      }
    };
  }, [location]);

  useEffect(() => {
    // Exclude course detail routes from scroll restoration
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    
    if (isCourseDetail) {
      // Course details handle their own scroll-to-top
      return;
    }
    
    // Restore scroll position for this route
    const currentPath = location.pathname + location.search;
    const savedPosition = scrollPositions.get(currentPath);
    
    if (savedPosition !== undefined) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    } else {
      // New route - scroll to top
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
};
