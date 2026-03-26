import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

const PAGE_SIZE = 24;

interface UseProfilePostsParams {
  userId: string | undefined;
  actorType: 'personal' | 'business';
  actorId: string;
}

export interface PostCounts {
  total: number;
  videos: number;
  photos: number;
  reviews: number;
}

export function useProfilePosts({ userId, actorType, actorId }: UseProfilePostsParams) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['profile-posts', actorType, actorId],
    queryFn: async ({ pageParam }) => {

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      const params: Record<string, any> = {
        p_user_id: userId ?? null,
        p_actor_type: actorType,
        p_actor_id: actorId,
        p_page_size: PAGE_SIZE,
        p_seen_post_ids: seenPostIds.current,
      };

      if (cursor) params.p_cursor = cursor;

      const { data, error } = await supabase.rpc('get_profile_posts', params as any);

      if (error) {
        console.error('[ProfilePosts] RPC error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = data as FeedRpcRow[];
      const posts = groupMultiMedia(rows.map(mapRowToFeedPost));

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }

      const lastRow = rows[rows.length - 1];
      const nextCursor = rows.length >= PAGE_SIZE ? lastRow.post_created_at : undefined;

      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!actorId,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allPosts = useMemo(() => {
    const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
    const seen = new Set<string>();
    return posts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [query.data]);

  // NOTE: postCounts reflects only currently-loaded pages, not the full total.
  // Counts increment as more pages are fetched via infinite scroll.
  // To show a true total, the RPC would need to return a separate count field.
  const postCounts = useMemo<PostCounts>(() => {
    const counts = { total: 0, videos: 0, photos: 0, reviews: 0 };
    for (const post of allPosts) {
      counts.total++;
      if (post.isReview) {
        counts.reviews++;
      } else {
        const hasVideo = post.mediaItems.some(m => m.type === 'video');
        if (hasVideo) {
          counts.videos++;
        } else {
          counts.photos++;
        }
      }
    }
    return counts;
  }, [allPosts]);

  const resetSeen = useCallback(() => {
    seenPostIds.current = [];
  }, []);

  return {
    posts: allPosts,
    postCounts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}
