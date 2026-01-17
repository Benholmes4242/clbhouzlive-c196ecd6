/**
 * Enhanced Route Prefetch Hook
 * 
 * Combines code-splitting prefetch with video data/HLS manifest prefetching
 * for instant page loads with ready-to-play videos.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// ============ Types ============

export interface RoutePrefetchConfig {
  /** Route path */
  path: string;
  /** React Query key for this route's data */
  queryKey: string[];
  /** Function to fetch the data */
  queryFn: () => Promise<any>;
  /** Extract video URLs from fetched data */
  extractVideoUrls: (data: any) => string[];
  /** How many videos to prefetch HLS manifests for */
  videoPrefetchCount: number;
  /** Priority (higher = prefetch sooner) */
  priority?: number;
}

export interface UseRoutePrefetchOptions {
  routes: RoutePrefetchConfig[];
  /** Whether prefetching is enabled */
  enabled?: boolean;
  /** Delay in ms before starting prefetch after trigger */
  delay?: number;
  /** Only prefetch on wifi/good connection */
  respectConnection?: boolean;
}

// ============ Module State ============

// Track which routes have been prefetched to avoid duplicate requests
const prefetchedRoutes = new Set<string>();
const prefetchedHlsManifests = new Set<string>();

// Map of route paths to their lazy import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  '/discover': () => import('@/pages/Discover'),
  '/clubhouse': () => import('@/pages/Clubhouse'),
};

// ============ HLS Manifest Preload ============

/**
 * Prefetch an HLS manifest to warm the browser cache
 */
async function preloadHlsManifest(url: string): Promise<void> {
  if (!url || prefetchedHlsManifests.has(url)) return;
  
  try {
    prefetchedHlsManifests.add(url);
    
    // Use fetch with low priority to not block critical resources
    await fetch(url, {
      method: 'GET',
      // @ts-ignore - priority hint
      priority: 'low',
      credentials: 'omit',
    });
  } catch (error) {
    // Silent fail - prefetch is best-effort
    prefetchedHlsManifests.delete(url);
  }
}

// ============ Legacy Single-Route Hook ============

/**
 * Simple hook for prefetching route code on hover (original API)
 */
export function useRoutePrefetch(routePath: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(() => {
    if (prefetchedRoutes.has(routePath)) return;
    
    const importFn = routeImports[routePath];
    if (!importFn) return;

    prefetchedRoutes.add(routePath);
    
    importFn().catch(() => {
      prefetchedRoutes.delete(routePath);
    });
  }, [routePath]);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(prefetch, 100);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onFocus = useCallback(() => {
    prefetch();
  }, [prefetch]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    prefetch,
  };
}

// ============ Enhanced Multi-Route Hook ============

/**
 * Enhanced hook for prefetching route code + video data + HLS manifests
 */
export function useEnhancedRoutePrefetch({
  routes,
  enabled = true,
  delay = 1000,
  respectConnection = true,
}: UseRoutePrefetchOptions) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should prefetch based on connection
  const shouldPrefetch = useCallback(() => {
    if (!enabled) return false;
    
    if (respectConnection && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      // Don't prefetch on slow connections or data saver mode
      if (connection?.effectiveType === '2g' || connection?.saveData) {
        return false;
      }
    }
    
    return true;
  }, [enabled, respectConnection]);

  // Prefetch a single route
  const prefetchRoute = useCallback(async (config: RoutePrefetchConfig) => {
    if (prefetchedRoutes.has(config.path)) return;
    if (!shouldPrefetch()) return;

    console.log(`[RoutePrefetch] Prefetching route: ${config.path}`);
    prefetchedRoutes.add(config.path);

    try {
      // 1. Prefetch route code chunk
      const importFn = routeImports[config.path];
      if (importFn) {
        importFn().catch(() => {});
      }

      // 2. Prefetch data via React Query
      const data = await queryClient.fetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // 3. Extract video URLs and prefetch HLS manifests
      const videoUrls = config.extractVideoUrls(data);
      const urlsToPreload = videoUrls.slice(0, config.videoPrefetchCount);

      console.log(`[RoutePrefetch] Preloading ${urlsToPreload.length} HLS manifests for ${config.path}`);

      // Prefetch HLS manifests in parallel (best-effort)
      await Promise.allSettled(
        urlsToPreload.map(url => preloadHlsManifest(url))
      );

      console.log(`[RoutePrefetch] Completed prefetch for ${config.path}`);
    } catch (error) {
      console.warn(`[RoutePrefetch] Failed to prefetch ${config.path}:`, error);
      prefetchedRoutes.delete(config.path);
    }
  }, [queryClient, shouldPrefetch]);

  // Prefetch high-priority routes on mount
  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      // Sort by priority (higher first)
      const sortedRoutes = [...routes].sort(
        (a, b) => (b.priority || 0) - (a.priority || 0)
      );

      // Prefetch high-priority routes
      const highPriorityRoutes = sortedRoutes.filter(r => (r.priority || 0) >= 1);
      highPriorityRoutes.forEach(route => prefetchRoute(route));
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, delay, routes, prefetchRoute]);

  // Manual prefetch trigger for hover/focus
  const triggerPrefetch = useCallback((path: string) => {
    const route = routes.find(r => r.path === path);
    if (route) {
      prefetchRoute(route);
    }
  }, [routes, prefetchRoute]);

  // Check if a route has been prefetched
  const isPrefetched = useCallback((path: string) => {
    return prefetchedRoutes.has(path);
  }, []);

  // Reset prefetch state
  const reset = useCallback(() => {
    prefetchedRoutes.clear();
    prefetchedHlsManifests.clear();
  }, []);

  return {
    triggerPrefetch,
    isPrefetched,
    reset,
    prefetchedRoutes,
  };
}

// ============ Utility Functions ============

/**
 * Prefetch multiple routes at once (e.g., on app mount for critical routes)
 */
export function prefetchCriticalRoutes() {
  const criticalRoutes = ['/', '/discover', '/explore'];
  
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

/**
 * Prefetch HLS manifests for a list of video URLs
 */
export async function prefetchVideoManifests(urls: string[], maxCount = 8): Promise<void> {
  const urlsToPreload = urls.slice(0, maxCount);
  await Promise.allSettled(urlsToPreload.map(preloadHlsManifest));
}

export default useRoutePrefetch;
