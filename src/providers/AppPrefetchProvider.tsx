/**
 * AppPrefetchProvider - Route-based video prefetch provider
 * 
 * Prefetches video data + HLS manifests for primary routes on app load
 * and on navigation hover/touch to ensure instant playback.
 */

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';

// ============ Types ============

interface PrefetchContextValue {
  /** Trigger prefetch for a specific route */
  triggerPrefetch: (path: string) => void;
  /** Check if a route has been prefetched */
  isPrefetched: (path: string) => boolean;
  /** Reset all prefetch state */
  reset: () => void;
}

interface RoutePrefetchConfig {
  path: string;
  queryKey: string[];
  priority: number;
  queryFn?: () => Promise<any>;
  extractVideoUrls?: (data: any) => string[];
  videoPrefetchCount?: number;
}

// ============ Context ============

const PrefetchContext = createContext<PrefetchContextValue | null>(null);

// ============ Hook ============

export function usePrefetch(): PrefetchContextValue {
  const context = useContext(PrefetchContext);
  if (!context) {
    // Return no-op if not in provider (graceful fallback)
    return {
      triggerPrefetch: () => {},
      isPrefetched: () => false,
      reset: () => {},
    };
  }
  return context;
}

// ============ Query Functions ============

const PAGE_SIZE = 24;

async function fetchWatchShortsBase() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      like_count,
      post_media!inner (
        id,
        media_url,
        media_type,
        poster_url,
        duration_seconds,
        aspect_ratio,
        width,
        height
      )
    `)
    .eq('visibility', 'anyone')
    .eq('post_media.media_type', 'video')
    .lte('post_media.duration_seconds', 240)
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) throw error;

  // Transform to match expected format
  return (data || []).filter(post => 
    post.post_media && post.post_media.length > 0
  ).map(post => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    user_id: post.user_id,
    like_count: post.like_count || 0,
    media: (post.post_media || []).map((m: any) => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      poster_url: m.poster_url,
      duration_seconds: m.duration_seconds,
      aspect_ratio: m.aspect_ratio,
      width: m.width,
      height: m.height,
    })),
  }));
}

// ============ Route configs ============

const ROUTE_CONFIGS: RoutePrefetchConfig[] = [
  {
    path: '/clubhouse',
    queryKey: ['clubhouse-explore-shorts'],
    priority: 2,
    extractVideoUrls: (data) => {
      if (!data?.pages) return [];
      return data.pages
        .flatMap((page: any) => page.posts || [])
        .filter((post: any) => post.media?.[0]?.media_url)
        .map((post: any) => {
          const streamId = uidFromNode({ src: post.media[0].media_url });
          return streamId ? generateStreamHlsUrl(streamId) : null;
        })
        .filter(Boolean)
        .slice(0, 8);
    },
    videoPrefetchCount: 8,
  },
  {
    path: '/',
    queryKey: ['clubhouse-explore-shorts'],
    priority: 2,
    extractVideoUrls: (data) => {
      if (!data?.pages) return [];
      return data.pages
        .flatMap((page: any) => page.posts || [])
        .filter((post: any) => post.media?.[0]?.media_url)
        .map((post: any) => {
          const streamId = uidFromNode({ src: post.media[0].media_url });
          return streamId ? generateStreamHlsUrl(streamId) : null;
        })
        .filter(Boolean)
        .slice(0, 8);
    },
    videoPrefetchCount: 8,
  },
  {
    path: '/discover',
    // Use a stable query key that matches useWatchShorts
    queryKey: ['watch-shorts-base'],
    priority: 2,
    queryFn: fetchWatchShortsBase,
    extractVideoUrls: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((short: any) => short.media?.[0]?.media_url)
        .map((short: any) => {
          const streamId = uidFromNode({ src: short.media[0].media_url });
          return streamId ? generateStreamHlsUrl(streamId) : null;
        })
        .filter(Boolean)
        .slice(0, 12);
    },
    videoPrefetchCount: 12,
  },
];

// ============ Provider ============

interface AppPrefetchProviderProps {
  children: React.ReactNode;
  /** Delay before auto-prefetch on mount (ms) */
  delay?: number;
  /** Whether to enable prefetching */
  enabled?: boolean;
}

export function AppPrefetchProvider({ 
  children, 
  delay = 2000,
  enabled = true,
}: AppPrefetchProviderProps) {
  const queryClient = useQueryClient();
  const prefetchedRoutes = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should prefetch based on connection
  const shouldPrefetch = useCallback(() => {
    if (!enabled) return false;
    
    // Respect data saver mode and slow connections
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.saveData) return false;
      if (connection?.effectiveType === '2g') return false;
    }
    
    return true;
  }, [enabled]);

  // Helper to preload HLS manifests from fetched data
  const preloadVideosFromData = useCallback(async (data: any, config: RoutePrefetchConfig) => {
    if (!data || !config.extractVideoUrls) return;

    try {
      const videoUrls = config.extractVideoUrls(data);
      const urlsToPreload = videoUrls.slice(0, config.videoPrefetchCount || 8);

      if (urlsToPreload.length === 0) {
        console.log(`[AppPrefetch] No video URLs to preload for ${config.path}`);
        return;
      }

      console.log(`[AppPrefetch] Preloading ${urlsToPreload.length} HLS manifests`);

      await Promise.allSettled(
        urlsToPreload.map(url => preloadHlsManifest(url))
      );

      console.log(`[AppPrefetch] ✅ HLS preload complete for ${config.path}`);
    } catch (error) {
      console.warn(`[AppPrefetch] HLS preload failed:`, error);
    }
  }, []);

  // Prefetch route data
  const prefetchRoute = useCallback(async (path: string) => {
    if (prefetchedRoutes.current.has(path)) return;
    if (!shouldPrefetch()) return;

    const config = ROUTE_CONFIGS.find(r => r.path === path);
    if (!config) return;

    console.log(`[AppPrefetch] Prefetching route: ${path}`);
    prefetchedRoutes.current.add(path);

    try {
      // Check if we already have fresh data
      const existingData = queryClient.getQueryData(config.queryKey);
      if (existingData) {
        console.log(`[AppPrefetch] Route ${path} already in cache`);
        // Still preload HLS manifests for cached data
        await preloadVideosFromData(existingData, config);
        return;
      }

      // Only fetch if we have a queryFn
      if (config.queryFn) {
        console.log(`[AppPrefetch] Fetching data for ${path}`);
        const data = await config.queryFn();
        
        // Store as infinite query format so useInfiniteQuery can use it
        // The infinite query expects { pages: [...], pageParams: [...] }
        const infiniteData = {
          pages: [{ items: data, nextCursor: data.length, hasMore: true }],
          pageParams: [0],
        };
        
        queryClient.setQueryData(config.queryKey, infiniteData);
        console.log(`[AppPrefetch] Cached ${data.length} items in infinite query format`);

        // Preload HLS manifests for the first N videos
        await preloadVideosFromData(data, config);
      } else {
        // No queryFn - just check cache for HLS preload
        const cachedData = queryClient.getQueryData(config.queryKey);
        if (cachedData) {
          // Handle both flat array and infinite query format
          const items = Array.isArray(cachedData) 
            ? cachedData 
            : (cachedData as any)?.pages?.flatMap((p: any) => p.items) || [];
          await preloadVideosFromData(items, config);
        }
      }

      console.log(`[AppPrefetch] ✅ Prefetch complete for ${path}`);
    } catch (error) {
      console.warn(`[AppPrefetch] Failed to prefetch ${path}:`, error);
      prefetchedRoutes.current.delete(path);
    }
  }, [queryClient, shouldPrefetch, preloadVideosFromData]);

  // Auto-prefetch high priority routes on mount
  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      const highPriorityRoutes = ROUTE_CONFIGS
        .filter(r => r.priority >= 2)
        .sort((a, b) => b.priority - a.priority);

      highPriorityRoutes.forEach(route => {
        prefetchRoute(route.path);
      });
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, delay, prefetchRoute]);

  // Context value
  const value: PrefetchContextValue = {
    triggerPrefetch: prefetchRoute,
    isPrefetched: (path: string) => prefetchedRoutes.current.has(path),
    reset: () => {
      prefetchedRoutes.current.clear();
    },
  };

  return (
    <PrefetchContext.Provider value={value}>
      {children}
    </PrefetchContext.Provider>
  );
}

export default AppPrefetchProvider;
