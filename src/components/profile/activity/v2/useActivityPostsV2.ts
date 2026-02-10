// Activity Posts V2 Hook - Cursor-based Infinite Query
// Replaces useActivityPosts with proper pagination using Supabase .range()

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { activityPostToUnified } from '@/components/shared/grid/adapters';
import { ActivityPost } from '@/components/profile/types/ActivityTypes';
import { DEFAULT_ACTIVITY_GRID_CONFIG } from './types';

const PAGE_SIZE = DEFAULT_ACTIVITY_GRID_CONFIG.pageSize; // 24 items = ~8 blocks

interface ActivityPageData {
  items: UnifiedMediaItem[];
  nextCursor: number;
  hasMore: boolean;
}

/**
 * Cursor-based infinite query for activity posts
 * Uses Supabase .range() for stable pagination
 */
export function useActivityPostsV2(actorId?: string) {
  const query = useInfiniteQuery<ActivityPageData>({
    queryKey: [...postKeys.actorPosts('personal', actorId ?? ''), 'v2'],
    enabled: !!actorId,
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<ActivityPageData> => {
      if (!actorId) {
        return { items: [], nextCursor: 0, hasMore: false };
      }

      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      // Fetch posts with range-based pagination
      const { data: postsData, error: postsError } = await supabase
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
        .eq('actor_type', 'personal')
        .eq('actor_id', actorId)
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (postsError) {
        console.error('[useActivityPostsV2] Supabase error:', postsError);
        return { items: [], nextCursor: startRange, hasMore: false };
      }

      // Fetch user profile once (first page only optimization could be added)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', actorId)
        .single();

      // Batch fetch ratings for posts with source_review_id
      const reviewIds = (postsData ?? [])
        .filter((p: any) => p.source_review_id)
        .map((p: any) => p.source_review_id);

      let ratingsMap = new Map<string, number>();
      if (reviewIds.length > 0) {
        const { data: ratings } = await supabase
          .from('course_ratings')
          .select('id, rating')
          .in('id', reviewIds);

        if (ratings) {
          ratingsMap = new Map(ratings.map(r => [r.id, r.rating]));
        }
      }

      // Transform to ActivityPost format
      const activityPosts: ActivityPost[] = (postsData ?? [])
        .filter((post: any) => {
          const hasMedia = post.post_media && post.post_media.length > 0;
          return hasMedia; // Activity grid requires media
        })
        .map((post: any) => {
          const tags = post.post_tags?.map((tag: any) => ({
            id: tag.id,
            post_id: post.id,
            tagged_entity_id: tag.tagged_entity_id,
            entity_type: tag.taggable_entities?.entity_type,
            entity_id: tag.taggable_entities?.entity_id,
            name: tag.taggable_entities?.name,
            username: tag.taggable_entities?.username,
            tagged_entity: tag.taggable_entities,
          })) || [];

          // Determine if this is a review post (only if linked to actual review)
          const isReview = !!post.source_review_id;

          const rating = post.source_review_id
            ? ratingsMap.get(post.source_review_id)
            : undefined;

          const course = post.course;

          return {
            id: post.id,
            type: 'post' as const,
            content: post.content || '',
            likes: 0,
            comments: 0,
            shares: 0,
            timeAgo: new Date(post.created_at).toLocaleDateString(),
            created_at: post.created_at,
            course_id: post.course_id || null,
            badges: post.badges || [],
            categories: post.categories || [],
            source_review_id: post.source_review_id || null,
            isReview,
            rating,
            course: course
              ? {
                  id: course.id,
                  name: course.name,
                  country: course.country,
                  sub_country: course.sub_country,
                  region: course.region,
                }
              : undefined,
            post_media: (post.post_media || []).map((media: any) => ({
              id: media.id,
              media_type: media.media_type as 'image' | 'video',
              media_url: media.media_url,
              poster_url: media.poster_url,
              aspect_ratio: media.aspect_ratio,
              width: media.width,
              height: media.height,
              duration_seconds: media.duration_seconds,
              filter_id: media.filter_id,
              studio_edits: media.studio_edits,
            })),
            post_tags: tags,
            user: {
              id: actorId,
              display_name: profileData?.display_name || null,
              username: profileData?.username || null,
              profile_photo_url: profileData?.profile_photo_url || null,
            },
            image: post.post_media?.find((m: any) => m.media_type === 'image')?.media_url,
          };
        });

      // Convert to UnifiedMediaItem
      const items = activityPosts
        .map((post, index) => activityPostToUnified(post, startRange + index))
        .filter((item): item is UnifiedMediaItem => item !== null);

      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;

      return {
        items,
        nextCursor: startRange + PAGE_SIZE,
        hasMore,
      };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },

    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten all pages into single items array
  const allItems = query.data?.pages.flatMap(page => page.items) ?? [];
  const hasMore = query.hasNextPage ?? false;

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
