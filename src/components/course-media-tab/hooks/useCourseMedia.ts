import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
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
  const { activeActor } = useActiveActor();
  const seenPostIds = useRef<string[]>([]);

  // Reset page-1 exclusion list when the query identity changes (incl. actor switch).
  useEffect(() => {
    seenPostIds.current = [];
  }, [courseId, filter, activeActor?.type, activeActor?.id]);

  const query = useInfiniteQuery({
    queryKey: ['course-media-feed', courseId, filter, userId, activeActor?.type, activeActor?.id],
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

      const rows = data as unknown as FeedRpcRow[];
      // Each row = one media item = one tile. Do NOT group by post.
      const posts = rows.map(mapRowToFeedPost);

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }
      // Cap to last 500 to prevent unbounded growth
      if (seenPostIds.current.length > 500) {
        seenPostIds.current = seenPostIds.current.slice(-500);
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

  const countsQuery = useQuery({
    queryKey: ['course-media-counts', courseId, userId],
    enabled: !!userId && !!courseId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_media_counts', {
        p_user_id: userId,
        p_course_id: courseId,
      });
      if (error) throw error;
      const row = (data?.[0] ?? { photos: 0, videos: 0 }) as { photos: number; videos: number };
      return { photos: Number(row.photos), videos: Number(row.videos), total: Number(row.photos) + Number(row.videos) };
    },
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

  const mediaCounts: MediaCounts = countsQuery.data ?? { photos: 0, videos: 0, total: 0 };

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
