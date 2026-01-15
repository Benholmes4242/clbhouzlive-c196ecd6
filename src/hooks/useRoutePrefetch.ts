/**
 * Phase 5 Perf: Route prefetching on hover
 * Prefetches route chunks when user hovers over navigation links
 * This reduces perceived latency by starting code loading before click
 */

import { useCallback, useRef } from 'react';

// Track which routes have been prefetched to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

// Map of route paths to their lazy import functions
// Add routes as needed - these will be prefetched on hover
const routeImports: Record<string, () => Promise<unknown>> = {
  '/discover': () => import('@/pages/Discover'),
};

/**
 * Hook for prefetching route code on hover
 * 
 * Usage:
 * ```tsx
 * const { onMouseEnter } = useRoutePrefetch('/discover');
 * <Link to="/discover" onMouseEnter={onMouseEnter}>Discover</Link>
 * ```
 */
export function useRoutePrefetch(routePath: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(() => {
    // Already prefetched
    if (prefetchedRoutes.has(routePath)) return;
    
    // Find matching route import
    const importFn = routeImports[routePath];
    if (!importFn) return;

    // Mark as prefetched immediately to prevent duplicate requests
    prefetchedRoutes.add(routePath);
    
    // Start prefetching the route chunk
    importFn().catch(() => {
      // If prefetch fails, allow retry
      prefetchedRoutes.delete(routePath);
    });
  }, [routePath]);

  const onMouseEnter = useCallback(() => {
    // Small delay to avoid prefetching on accidental hovers
    timeoutRef.current = setTimeout(prefetch, 100);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onFocus = useCallback(() => {
    // Prefetch on keyboard focus as well
    prefetch();
  }, [prefetch]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    prefetch,
  };
}

/**
 * Prefetch multiple routes at once (e.g., on app mount for critical routes)
 */
export function prefetchCriticalRoutes() {
  const criticalRoutes = ['/', '/discover', '/explore'];
  
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleWork = typeof requestIdleCallback !== 'undefined' 
    ? requestIdleCallback 
    : (fn: () => void) => setTimeout(fn, 1);

  scheduleWork(() => {
    criticalRoutes.forEach(route => {
      if (prefetchedRoutes.has(route)) return;
      
      const importFn = routeImports[route];
      if (importFn) {
        prefetchedRoutes.add(route);
        importFn().catch(() => prefetchedRoutes.delete(route));
      }
    });
  });
}

export default useRoutePrefetch;
