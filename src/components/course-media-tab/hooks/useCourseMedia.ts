import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

export type CourseMediaFilter = 'all' | 'photos' | 'videos';

const PAGE_SIZE = 30;

interface UseCourseMediaParams {
  userId: string | undefined;
  courseId: string;
  filter: CourseMediaFilter;
}

export interface MediaCounts {
  photos: number;
  videos: number;
  total: number;
}

export function useCourseMedia({ userId, courseId, filter }: UseCourseMediaParams) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['course-media-feed', courseId, filter, userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      const params: Record<string, unknown> = {
        p_user_id: userId,
        p_course_id: courseId,
        p_filter: filter,
        p_page_size: PAGE_SIZE,
        p_seen_post_ids: seenPostIds.current,
      };

      if (cursor) params.p_cursor = cursor;

      const { data, error } = await supabase.rpc('get_course_media', params as any);

      if (error) {
        console.error('[CourseMedia] RPC error:', error);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = data as FeedRpcRow[];
      // Each row = one media item = one tile. Do NOT group by post.
      const posts = rows.map(mapRowToFeedPost);

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
    enabled: !!userId && !!courseId,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Dedup by media_id since the same post can have multiple media items.
  // This array drives the GRID — one tile per media item.
  const allPosts = useMemo(() => {
    const items = query.data?.pages.flatMap((page) => page.posts) ?? [];
    const seen = new Set<string>();
    return items.filter(item => {
      const mediaId = item.mediaItems[0]?.id || item.id;
      if (seen.has(mediaId)) return false;
      seen.add(mediaId);
      return true;
    });
  }, [query.data]);

  // Grouped by post_id with aggregated mediaItems[] — drives FULLSCREEN.
  // SnapFeed keys slides by post.id and expects this canonical shape, matching
  // every other pipeline (Clubhouse / Discover / Profile / Watch all run
  // groupMultiMedia upstream). Course media is the only RPC that returns
  // one-row-per-media, so we group here.
  const postsForFullscreen = useMemo(() => {
    const flat = query.data?.pages.flatMap((page) => page.posts) ?? [];
    return groupMultiMedia(flat);
  }, [query.data]);

  const mediaCounts = useMemo((): MediaCounts => {
    const firstPagePosts = query.data?.pages[0]?.posts ?? [];
    let photos = 0;
    let videos = 0;
    for (const post of firstPagePosts) {
      for (const item of post.mediaItems) {
        if (item.type === 'image') photos++;
        else if (item.type === 'video') videos++;
      }
    }
    return { photos, videos, total: photos + videos };
  }, [query.data]);

  const resetSeen = useCallback(() => {
    seenPostIds.current = [];
  }, []);

  return {
    posts: allPosts,
    postsForFullscreen,
    mediaCounts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}
