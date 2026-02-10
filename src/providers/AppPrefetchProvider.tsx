/**
 * AppPrefetchProvider - Route-based video prefetch provider
 * 
 * Prefetches video data + HLS manifests for primary routes on app load
 * and on navigation hover/touch to ensure instant playback.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
// Import shared context from hook file to avoid circular dependencies
import { AppPrefetchContext } from '@/hooks/useAppPrefetch';

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

// Re-export usePrefetch for backwards compatibility
export { useAppPrefetch as usePrefetch } from '@/hooks/useAppPrefetch';

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

// Fetch base clubhouse explore shorts data for prefetching
async function fetchClubhouseBase() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      like_count,
      visibility,
      post_media!inner (
        id,
        media_url,
        media_type,
        poster_url,
        duration_seconds,
        aspect_ratio,
        width,
        height,
        filter_id,
        studio_edits
      ),
      user_profiles (
        id,
        username,
        display_name,
        profile_photo_url
      )
    `)
    .eq('visibility', 'anyone')
    .eq('post_media.media_type', 'video')
    .lt('post_media.duration_seconds', 120)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  // Transform to match expected format for infinite query
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
      filter_id: m.filter_id,
      studio_edits: m.studio_edits,
    })),
    user: post.user_profiles,
  }));
}

// Fetch base community feed data for prefetching
async function fetchCommunityFeedBase() {
  // Get current user's followed users first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get friend IDs (accepted friendships)
  const { data: friendships } = await supabase
    .from('user_friends')
    .select('friend_id, user_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted');

  const friendIds = new Set<string>();
  (friendships ?? []).forEach((f: any) => {
    if (f.user_id === user.id) friendIds.add(f.friend_id);
    else friendIds.add(f.user_id);
  });

  // Get followed user IDs
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followedIds = new Set((following ?? []).map((f: any) => f.following_id));

  // Combine: community = friends + following (excluding self)
  const communityIds = new Set([...friendIds, ...followedIds]);
  communityIds.delete(user.id);

  if (communityIds.size === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      like_count,
      comment_count,
      visibility,
      post_media!inner (
        id,
        media_url,
        media_type,
        poster_url,
        duration_seconds,
        aspect_ratio,
        width,
        height
      ),
      user_profiles (
        id,
        username,
        display_name,
        profile_photo_url
      )
    `)
    .in('user_id', Array.from(communityIds))
    .eq('visibility', 'anyone')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).filter((post: any) => 
    post.post_media && post.post_media.length > 0
  ).map((post: any) => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    user_id: post.user_id,
    like_count: post.like_count || 0,
    comment_count: post.comment_count || 0,
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
    user: post.user_profiles,
  }));
}

// ============ Route configs ============

// Helper to extract video URLs from flat array format
function extractVideoUrlsFromArray(data: any[], count: number): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((post: any) => post.media?.[0]?.media_url)
    .map((post: any) => {
      const streamId = uidFromNode({ src: post.media[0].media_url });
      return streamId ? generateStreamHlsUrl(streamId) : null;
    })
    .filter(Boolean)
    .slice(0, count) as string[];
}

// Fetch base long-form videos data for prefetching
async function fetchLongFormVideosBase() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      like_count,
      comment_count,
      visibility,
      post_media!inner (
        id,
        media_url,
        media_type,
        poster_url,
        duration_seconds,
        aspect_ratio,
        width,
        height
      ),
      user_profiles (
        id,
        username,
        display_name,
        profile_photo_url
      )
    `)
    .eq('visibility', 'anyone')
    .eq('post_media.media_type', 'video')
    .gte('post_media.duration_seconds', 240)  // Long-form = 4+ minutes
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).filter(post => 
    post.post_media && post.post_media.length > 0
  ).map(post => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    user_id: post.user_id,
    like_count: post.like_count || 0,
    comment_count: post.comment_count || 0,
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
    user: post.user_profiles,
  }));
}

const ROUTE_CONFIGS: RoutePrefetchConfig[] = [
  {
    path: '/clubhouse',
    queryKey: ['clubhouse-explore-shorts'],
    priority: 1, // Highest priority - landing page
    queryFn: fetchClubhouseBase,
    extractVideoUrls: (data) => extractVideoUrlsFromArray(data, 8),
    videoPrefetchCount: 8,
  },
  {
    path: '/',
    queryKey: ['clubhouse-explore-shorts'],
    priority: 1, // Highest priority - landing page
    queryFn: fetchClubhouseBase,
    extractVideoUrls: (data) => extractVideoUrlsFromArray(data, 8),
    videoPrefetchCount: 8,
  },
  {
    path: '/discover',
    // Use a stable query key that matches useWatchShorts
    queryKey: ['watch-shorts-base'],
    priority: 2,
    queryFn: fetchWatchShortsBase,
    extractVideoUrls: (data) => extractVideoUrlsFromArray(data, 12),
    videoPrefetchCount: 12,
  },
  {
    path: '/discover',
    queryKey: ['watch-hero-video'],
    priority: 2,
    queryFn: async () => {
      const { fetchWatchHeroVideo } = await import('@/hooks/useWatchHeroVideo');
      return fetchWatchHeroVideo();
    },
    extractVideoUrls: (data: any) => {
      if (!data?.heroVideo?.media?.[0]?.media_url) return [];
      const streamId = uidFromNode({ src: data.heroVideo.media[0].media_url });
      return streamId ? [generateStreamHlsUrl(streamId)] : [];
    },
    videoPrefetchCount: 1,
  },
  {
    // Community tab within Discover - prefetch community feed
    path: '/discover/community',
    queryKey: ['community-feed-base'],
    priority: 3,
    queryFn: fetchCommunityFeedBase,
    extractVideoUrls: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((post: any) => post.media?.[0]?.media_type === 'video' && post.media?.[0]?.media_url)
        .map((post: any) => {
          const streamId = uidFromNode({ src: post.media[0].media_url });
          return streamId ? generateStreamHlsUrl(streamId) : null;
        })
        .filter(Boolean)
        .slice(0, 8) as string[];
    },
    videoPrefetchCount: 8,
  },
  {
    // Videos tab within Discover - prefetch long-form videos
    path: '/discover/videos',
    queryKey: ['longform-videos-base'],
    priority: 3,
    queryFn: fetchLongFormVideosBase,
    extractVideoUrls: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((post: any) => post.media?.[0]?.media_url)
        .map((post: any) => {
          const streamId = uidFromNode({ src: post.media[0].media_url });
          return streamId ? generateStreamHlsUrl(streamId) : null;
        })
        .filter(Boolean)
        .slice(0, 8) as string[];
    },
    videoPrefetchCount: 8,
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

      if (urlsToPreload.length === 0) return;

      await Promise.allSettled(
        urlsToPreload.map(url => preloadHlsManifest(url))
      );
    } catch {
      // Silent fail - prefetch errors shouldn't block the app
    }
  }, []);

  // Prefetch a single config entry
  const prefetchConfig = useCallback(async (config: RoutePrefetchConfig) => {
    try {
      // Check if we already have fresh data
      const existingData = queryClient.getQueryData(config.queryKey);
      if (existingData) {
        // Still preload HLS manifests for cached data
        await preloadVideosFromData(existingData, config);
        return;
      }

      // Only fetch if we have a queryFn
      if (config.queryFn) {
        const data = await config.queryFn();
        
        // Hero video returns a plain object, not an array — store directly
        if (!Array.isArray(data)) {
          queryClient.setQueryData(config.queryKey, data);
          await preloadVideosFromData(data, config);
          return;
        }

        // Store as infinite query format so useInfiniteQuery can use it
        const infiniteData = {
          pages: [{ items: data, nextCursor: data.length, hasMore: true }],
          pageParams: [0],
        };
        
        queryClient.setQueryData(config.queryKey, infiniteData);

        // Preload HLS manifests for the first N videos
        await preloadVideosFromData(data, config);
      } else {
        // No queryFn - just check cache for HLS preload
        const cachedData = queryClient.getQueryData(config.queryKey);
        if (cachedData) {
          const items = Array.isArray(cachedData) 
            ? cachedData 
            : (cachedData as any)?.pages?.flatMap((p: any) => p.items) || [];
          await preloadVideosFromData(items, config);
        }
      }
    } catch {
      // Silent fail
    }
  }, [queryClient, preloadVideosFromData]);

  // Prefetch route data — processes ALL configs for a path
  const prefetchRoute = useCallback(async (path: string) => {
    if (prefetchedRoutes.current.has(path)) return;
    if (!shouldPrefetch()) return;

    const configs = ROUTE_CONFIGS.filter(r => r.path === path);
    if (configs.length === 0) return;

    prefetchedRoutes.current.add(path);

    // Fire all configs for this path in parallel
    await Promise.allSettled(configs.map(config => prefetchConfig(config)));
  }, [shouldPrefetch, prefetchConfig]);

  // Auto-prefetch routes on mount with priority-based timing
  useEffect(() => {
    if (!enabled) return;

    // Priority 1 routes (landing page) - start immediately (100ms for hydration)
    const criticalRoutes = ROUTE_CONFIGS.filter(r => r.priority === 1);
    const standardRoutes = ROUTE_CONFIGS.filter(r => r.priority >= 2 && r.priority < 1);
    
    // Critical routes start almost immediately
    const criticalTimeout = setTimeout(() => {
      console.log('[AppPrefetch] Starting critical prefetch (landing page)');
      criticalRoutes.forEach(route => {
        prefetchRoute(route.path);
      });
    }, 100); // Just enough for React to hydrate

    // Standard routes wait for the configured delay
    timeoutRef.current = setTimeout(() => {
      console.log('[AppPrefetch] Starting standard prefetch');
      const highPriorityRoutes = ROUTE_CONFIGS
        .filter(r => r.priority >= 2)
        .sort((a, b) => b.priority - a.priority);

      highPriorityRoutes.forEach(route => {
        prefetchRoute(route.path);
      });
    }, delay);

    return () => {
      clearTimeout(criticalTimeout);
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
    <AppPrefetchContext.Provider value={value}>
      {children}
    </AppPrefetchContext.Provider>
  );
}

export default AppPrefetchProvider;
