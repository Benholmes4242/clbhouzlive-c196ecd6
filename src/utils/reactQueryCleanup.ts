/**
 * Phase 3: React Query session cleanup utilities
 * Clears sessionStorage and optionally invalidates queries on logout
 */

import { QueryClient } from '@tanstack/react-query';

const COURSES_SESSION_KEYS = [
  'explore-last-filters',
  'explore-scroll',
  'top100-last-filters',
  'top100-scroll',
  'friends-courses-filters',
];

/**
 * Clear courses-related sessionStorage on logout
 */
export const clearCoursesSessionStorage = () => {
  try {
    COURSES_SESSION_KEYS.forEach(key => {
      sessionStorage.removeItem(key);
    });
    console.info('[ReactQuery] Cleared courses sessionStorage');
  } catch (error) {
    console.warn('[ReactQuery] Failed to clear sessionStorage:', error);
  }
};

/**
 * Optionally invalidate specific query keys on logout
 * (Most queries use gcTime which will naturally expire)
 */
export const invalidateUserSpecificQueries = (queryClient: QueryClient) => {
  try {
    // Only invalidate user-specific queries that should not persist
    queryClient.invalidateQueries({ 
      queryKey: ['user-course-rating'],
      exact: false
    });
    
    queryClient.invalidateQueries({ 
      queryKey: ['user-courses'],
      exact: false
    });

    console.info('[ReactQuery] Invalidated user-specific queries');
  } catch (error) {
    console.warn('[ReactQuery] Failed to invalidate queries:', error);
  }
};

/**
 * Complete cleanup on logout
 */
export const cleanupOnLogout = (queryClient: QueryClient) => {
  clearCoursesSessionStorage();
  invalidateUserSpecificQueries(queryClient);
};
