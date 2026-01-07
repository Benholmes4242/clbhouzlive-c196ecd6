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

      // Separate actor IDs by type
      const userActorIds: string[] = [];
      const businessActorIds: string[] = [];
      
      postsData?.forEach(p => {
        if (p.actor_id) {
          if (p.actor_type === 'business') {
            businessActorIds.push(p.actor_id);
          } else {
            userActorIds.push(p.actor_id);
          }
        }
      });

      // Fetch user profiles
      const { data: userProfiles } = userActorIds.length > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', [...new Set(userActorIds)])
        : { data: [] };

      // Fetch business accounts
      const { data: businessAccounts } = businessActorIds.length > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, slug, logo_url')
            .in('id', [...new Set(businessActorIds)])
        : { data: [] };

      // Create lookup maps with proper typing
      const userProfileMap = new Map<string, { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null }>(
        (userProfiles || []).map(p => [p.id, p])
      );
      const businessAccountMap = new Map<string, { id: string; name: string; slug: string | null; logo_url: string | null }>(
        (businessAccounts || []).map(b => [b.id, b])
      );

      // Attach user data to posts (normalize business accounts to user-like structure)
      const postsWithUsers = (postsData || []).map(post => {
        if (post.actor_type === 'business' && post.actor_id) {
          const business = businessAccountMap.get(post.actor_id);
          return {
            ...post,
            user: business ? {
              id: business.id,
              display_name: business.name,
              username: business.slug,
              profile_photo_url: business.logo_url,
            } : null
          };
        } else if (post.actor_id) {
          return {
            ...post,
            user: userProfileMap.get(post.actor_id) ?? null
          };
        }
        return { ...post, user: null };
      });

      // Filter posts that have valid media
      const activityPosts = postsWithUsers.filter(
        (post) => post.post_media && post.post_media.length > 0
      );

      // Convert to UnifiedMediaItem using existing adapter
      const items = activityPosts
        .map((post, index) => activityPostToUnified(post as any, startRange + index))
        .filter((item): item is UnifiedMediaItem => item !== null);

      // Debug: log first item creator
      if (items.length > 0) {
        console.log('[WatchPostsV2] First item creator:', items[0].creator);
      }

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
