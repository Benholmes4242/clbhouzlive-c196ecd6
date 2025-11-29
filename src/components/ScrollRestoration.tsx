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
    // Exclude course detail routes and courses list page from triggering scroll-to-top on location changes
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    const isCoursesListPage = location.pathname === '/courses';
    
    // Save current scroll position before leaving (only for non-course-detail routes)
    return () => {
      if (!isCourseDetail) {
        // For courses list page, ignore search params (tab changes) when saving scroll position
        const currentPath = isCoursesListPage 
          ? location.pathname 
          : location.pathname + location.search;
        scrollPositions.set(currentPath, window.scrollY);
      }
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Exclude course detail routes and courses list page from scroll-to-top on location changes
    const isCourseDetail = /^\/courses\/[^/]+$/.test(location.pathname);
    const isCoursesListPage = location.pathname === '/courses';
    
    if (isCourseDetail) {
      // Course details handle their own scroll-to-top and preserve scroll on tab changes
      return;
    }
    
    // Restore scroll position for this route
    // For courses list page, ignore search params (tab changes) when restoring scroll position
    const currentPath = isCoursesListPage 
      ? location.pathname 
      : location.pathname + location.search;
    const savedPosition = scrollPositions.get(currentPath);
    
    if (savedPosition !== undefined) {
      // Wait for data to load before restoring scroll
      // Use a longer delay to ensure React Query has hydrated
      const timeoutId = setTimeout(() => {
        // Check if content is actually rendered by looking for a minimum body height
        if (document.body.scrollHeight > savedPosition) {
          window.scrollTo({
            top: savedPosition,
            behavior: 'instant'
          });
        } else {
          // Content not fully rendered, try again with RAF
          requestAnimationFrame(() => {
            window.scrollTo({
              top: savedPosition,
              behavior: 'instant'
            });
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (!isCoursesListPage) {
      // New route - scroll to top (but not for courses list page tab changes)
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);

  return null;
};
