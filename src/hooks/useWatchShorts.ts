/**
 * useWatchShorts - Fetches shorts (videos ≤4 min) for Watch tab grid
 * 
 * Features:
 * - Infinite scroll with cursor-based pagination
 * - 24 items per page
 * - Ordered by created_at (newest first)
 * - Excludes hero video from results (client-side filter)
 * - Uses stable query key for cache hits from route prefetch
 * - Fetches current user's like status per post
 */

import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const PAGE_SIZE = 24;

export interface WatchShort {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  like_count: number;
  media: {
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
    duration_seconds: number | null;
    aspect_ratio: number | null;
    width: number | null;
    height: number | null;
  }[];
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

interface WatchShortsPage {
  items: WatchShort[];
  nextCursor: number;
  hasMore: boolean;
}

export function useWatchShorts(excludeHeroId?: string) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  // Try to use prefetched base data on first load
  useEffect(() => {
    const prefetchedData = queryClient.getQueryData(['watch-shorts-base']);
    if (prefetchedData && Array.isArray(prefetchedData)) {
      console.log('[useWatchShorts] Found prefetched base data, warming cache');
      // The infinite query will fetch fresh, but we have HLS manifests preloaded
    }
  }, [queryClient]);

  const query = useInfiniteQuery({
    // Use consistent key for cache - matches AppPrefetchProvider
    // Hero filtering is done client-side to maximize cache hits
    queryKey: ['watch-shorts-base'],
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - match prefetch staleTime
    
    queryFn: async ({ pageParam = 0 }): Promise<WatchShortsPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      // Fetch posts without user_profiles join (no FK exists)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          like_count,
          course_id,
          golf_courses!posts_course_id_fkey (
            name
          ),
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
        .lte('post_media.duration_seconds', 240) // ≤4 minutes
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) throw error;

      // Filter out posts without valid media (hero filtering done in useMemo below)
      let posts = (data || []).filter(post => {
        return post.post_media && post.post_media.length > 0;
      });

      // Fetch user profiles separately (no FK between posts and user_profiles)
      const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      // Transform with profiles
      const items = posts.map(post => {
        const profile = profilesMap[post.user_id];
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user_id: post.user_id,
          like_count: post.like_count || 0,
          golf_courses: (post as any).golf_courses || null,
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
          creator: profile ? {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            profile_photo_url: profile.profile_photo_url,
          } : null,
        };
      });

      const hasMore = (data?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      console.log('[useWatchShorts] Fetched page:', {
        startRange,
        itemCount: items.length,
        hasMore,
        firstId: items[0]?.id?.slice(0, 8),
      });

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
  });

  // Flatten pages into single array, then filter out hero client-side
  const allShorts = query.data?.pages.flatMap((page) => page.items) ?? [];
  
  // Client-side filter for hero - allows cache reuse regardless of heroId
  const shorts = useMemo(() => {
    if (!excludeHeroId) return allShorts;
    return allShorts.filter(short => short.id !== excludeHeroId);
  }, [allShorts, excludeHeroId]);

  // Fetch current user's liked post IDs for personalized heart state
  const postIds = useMemo(() => shorts.map(s => s.id), [shorts]);
  const { data: likedPostIds = new Set<string>() } = useQuery({
    queryKey: ['watch-shorts-user-likes', user?.id, postIds],
    queryFn: async () => {
      if (!user?.id || postIds.length === 0) return new Set<string>();
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      return new Set((data || []).map(d => d.post_id));
    },
    enabled: !!user?.id && postIds.length > 0,
    staleTime: 60_000,
  });

  const hasNextPage = query.hasNextPage ?? false;

  // =========================================================================
  // LOAD MORE DEDUPLICATION (Watch tab)
  // Prevents triple-fire caused by rapid sequential calls before React Query
  // flips isFetchingNextPage=true.
  // =========================================================================
  const loadMoreInProgressRef = useRef(false);
  const lastLoadMoreTimeRef = useRef(0);
  const LOAD_MORE_COOLDOWN_MS = 300;

  const guardedFetchNextPage = useCallback(async () => {
    // Synchronous guard - prevents parallel calls
    if (loadMoreInProgressRef.current) {
      console.log('[useWatchShorts] Load more BLOCKED - in progress');
      return;
    }
    loadMoreInProgressRef.current = true;

    // Time-based guard - prevents rapid sequential calls
    const now = Date.now();
    if (now - lastLoadMoreTimeRef.current < LOAD_MORE_COOLDOWN_MS) {
      console.log('[useWatchShorts] Load more BLOCKED - cooldown');
      loadMoreInProgressRef.current = false;
      return;
    }
    lastLoadMoreTimeRef.current = now;

    try {
      console.log('[useWatchShorts] 🚀 Load more executing');
      await query.fetchNextPage();
    } finally {
      loadMoreInProgressRef.current = false;
    }
  }, [query.fetchNextPage]);

  return {
    shorts,
    likedPostIds,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage,
    fetchNextPage: guardedFetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

export default useWatchShorts;
