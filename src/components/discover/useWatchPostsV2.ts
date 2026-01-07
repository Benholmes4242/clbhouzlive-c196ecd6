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

      // Fetch posts with video media under 4 minutes (matching Activity grid pattern)
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          badges,
          categories,
          source_review_id,
          post_media (
            id,
            media_type,
            media_url,
            poster_url,
            aspect_ratio,
            width,
            height,
            duration_seconds,
            filter_id,
            studio_edits
          ),
          post_tags (
            id,
            tagged_entity_id,
            start_index,
            end_index,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          ),
          course:golf_courses!course_id (
            id,
            name,
            country,
            sub_country,
            region
          )
        `)
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .lte('post_media.duration_seconds', 240)
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) throw error;

      // Get unique actor IDs
      const actorIds = [...new Set(postsData?.map(p => p.actor_id).filter(Boolean))] as string[];

      // Fetch user profiles for all actors
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', actorIds);

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      // Attach user data to posts
      const postsWithUsers = (postsData || []).map(post => ({
        ...post,
        user: post.actor_id ? profileMap.get(post.actor_id) : null
      }));

      // Filter posts that have valid media
      const activityPosts = postsWithUsers.filter(
        (post) => post.post_media && post.post_media.length > 0
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
