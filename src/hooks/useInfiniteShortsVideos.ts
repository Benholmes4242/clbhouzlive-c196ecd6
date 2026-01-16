import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 12;

// Shorts are videos under 4 minutes (240 seconds)
const MAX_SHORT_DURATION_SECONDS = 240;

export interface ShortVideo {
  id: string;
  title: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  thumbnailUrl: string;
  mediaUrl?: string;
  duration: string;
  durationSeconds: number;
  views: number;
  likes: number;
  createdAt: string;
}

interface ShortsPage {
  items: ShortVideo[];
  nextCursor: number;
  hasMore: boolean;
}

interface UseInfiniteShortsVideosOptions {
  creatorUserId?: string;    // Filter by user_id (personal posts)
  maxDuration?: number;
  enabled?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Infinite scroll hook for shorts videos (<4 minutes, public visibility)
 * Used primarily for Creator Page shorts tab
 */
export function useInfiniteShortsVideos(options: UseInfiniteShortsVideosOptions = {}) {
  const { 
    creatorUserId, 
    maxDuration = MAX_SHORT_DURATION_SECONDS,
    enabled = true 
  } = options;

  const query = useInfiniteQuery({
    queryKey: ['shorts-infinite-v2', creatorUserId || 'all', maxDuration],
    initialPageParam: 0,
    enabled,
    
    queryFn: async ({ pageParam = 0 }): Promise<ShortsPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      console.log('[useInfiniteShortsVideos] 🔍 FETCHING PAGE:', {
        creatorUserId,
        maxDuration,
        startRange,
        endRange,
      });

      // Build query for short videos
      let baseQuery = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner(
            media_url,
            duration_seconds,
            poster_url,
            width,
            height
          ),
          post_likes(count),
          post_views(count)
        `)
        .eq('post_media.media_type', 'video')
        .lt('post_media.duration_seconds', maxDuration) // <4 minutes
        .gt('post_media.duration_seconds', 0) // Has valid duration
        .not('post_media.duration_seconds', 'is', null)
        .eq('visibility', 'anyone')
        .eq('status', 'published'); // Only show published posts

      // Filter by user_id for personal posts
      if (creatorUserId) {
        baseQuery = baseQuery.eq('user_id', creatorUserId);
      }

      baseQuery = baseQuery
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      const { data: postsData, error } = await baseQuery;

      console.log('[useInfiniteShortsVideos] 📊 QUERY RESULT:', {
        postsReturned: postsData?.length || 0,
        error: error?.message,
      });

      if (error) throw error;

      // Fetch profiles for creators
      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id).filter(Boolean))] as string[];
      
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userIds);
        
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      // Transform to ShortVideo format
      const items: ShortVideo[] = (postsData || []).map((post: any) => {
        const media = post.post_media?.[0];
        const user = profileMap.get(post.user_id);
        const views = post.post_views?.[0]?.count || 0;
        const likes = post.post_likes?.[0]?.count || 0;

        return {
          id: post.id,
          title: post.content?.split('\n')[0]?.substring(0, 100) || '',
          creatorUserId: post.user_id,
          creatorName: user?.display_name || user?.username || 'Unknown',
          creatorAvatarUrl: user?.profile_photo_url,
          thumbnailUrl: media?.poster_url || '',
          mediaUrl: media?.media_url || undefined,
          duration: formatDuration(media?.duration_seconds || 0),
          durationSeconds: media?.duration_seconds || 0,
          views,
          likes,
          createdAt: post.created_at,
        };
      });

      // Determine if there are more pages
      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      console.log('[useInfiniteShortsVideos] ✅ PAGE COMPLETE:', {
        itemsReturned: items.length,
        hasMore,
        nextCursor
      });

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const allItems = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export default useInfiniteShortsVideos;
