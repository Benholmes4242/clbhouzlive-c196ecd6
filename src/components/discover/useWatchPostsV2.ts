import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { activityPostToUnified } from '@/components/shared/grid/adapters';

const PAGE_SIZE = 24;

interface WatchPostsPage {
  items: UnifiedMediaItem[];
  nextCursor: number;
  hasMore: boolean;
}

/**
 * Fetches posts for Watch page:
 * - All users
 * - Videos only
 * - Under 4 minutes (240 seconds)
 * - Both portrait and landscape orientations
 * - Public visibility
 * - Cursor-based pagination
 */
export function useWatchPostsV2() {
  const query = useInfiniteQuery({
    queryKey: ['watch-posts', 'v2'],
    enabled: true,
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<WatchPostsPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      // Fetch posts with video media under 4 minutes
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_actor_id_fkey(id, display_name, username, profile_photo_url),
          media:post_media!inner(*),
          course:golf_courses(id, name, city, sub_country, country)
        `)
        .eq('visibility', 'anyone')
        .is('deleted_at', null)
        .eq('media.media_type', 'video')
        .lte('media.duration_seconds', 240)
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) throw error;

      // Filter posts that have valid media
      const activityPosts = (postsData || []).filter(
        (post) => post.media && post.media.length > 0
      );

      // Convert to UnifiedMediaItem using existing adapter
      const items = activityPosts
        .map((post, index) => activityPostToUnified(post as any, startRange + index))
        .filter((item): item is UnifiedMediaItem => item !== null);

      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
  });

  // Flatten pages into single array
  const allItems = query.data?.pages.flatMap((page) => page.items) ?? [];
  const hasMore = query.hasNextPage ?? false;

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
