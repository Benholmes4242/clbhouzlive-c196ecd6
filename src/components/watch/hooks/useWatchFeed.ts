import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import { enforceCreatorDiversity, enforceCourseDiversity } from '@/components/media-system/utils/feedAlgorithm';
import { useWatchPersonalSignals, computePersonalBoost } from './useWatchPersonalSignals';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import type { WatchFilter } from '../types';
import type { WatchMoodId } from '../proshop/hooks/useWatchMood';

const PAGE_SIZE = 30;

const MOOD_TO_FILTER: Record<WatchMoodId, WatchFilter> = {
  all: 'latest',
  trending: 'trending',
  follows: 'latest',
  played_courses: 'latest',
};

interface UseWatchFeedParams {
  userId: string | undefined;
  filter?: WatchFilter;
  mood?: WatchMoodId;
  category?: string;
  searchQuery?: string;
  userLat?: number | null;
  userLng?: number | null;
  enabled?: boolean;
}

export function useWatchFeed({ userId, filter, mood, category, searchQuery, userLat, userLng, enabled = true }: UseWatchFeedParams) {
  const resolvedFilter: WatchFilter = mood ? MOOD_TO_FILTER[mood] : (filter ?? 'trending');
  const seenPostIds = useRef<string[]>([]);
  const { activeActor } = useActiveActor();

  // Reset page-1 exclusion list when the query identity changes (incl. actor switch).
  useEffect(() => {
    seenPostIds.current = [];
  }, [resolvedFilter, mood, category, searchQuery, userId, activeActor?.type, activeActor?.id]);


  const query = useInfiniteQuery({
    queryKey: ['watch-feed', resolvedFilter, mood ?? null, category ?? null, searchQuery, userId, activeActor?.type, activeActor?.id],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;



      const params: Record<string, any> = {
        p_user_id: userId,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
        p_mode: resolvedFilter,
        p_page_size: PAGE_SIZE,
      };

      params.p_seen_ids = seenPostIds.current;

      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;
      if (resolvedFilter === 'near' && userLat != null && userLng != null) {
        params.p_user_lat = userLat;
        params.p_user_lng = userLng;
      }
      if (category) params.p_category = category;

      const { data, error } = await supabase.rpc('get_watch_shorts', params as any);

      if (error) {
        console.error('[WatchFeed] RPC error:', error);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = data as unknown as FeedRpcRow[];
      const posts = groupMultiMedia(rows.map(mapRowToFeedPost));

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }
      // Prevent unbounded growth — cap at last 200
      if (seenPostIds.current.length > 200) {
        seenPostIds.current = seenPostIds.current.slice(-200);
      }

      const lastRow = rows[rows.length - 1];
      const nextCursor = rows.length >= PAGE_SIZE ? lastRow.post_created_at : undefined;

      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId && enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const personalSignals = useWatchPersonalSignals(userId);

  const allPosts = useMemo(() => {
    const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
    const seen = new Set<string>();
    let deduped = posts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Mood-scoped client-side filtering. RPC already returns the right mode;
    // these narrow the result set further for follows / played_courses.
    if (mood === 'follows') {
      deduped = deduped.filter(p =>
        p.creatorRelation === 'following' || p.creatorRelation === 'friend' || p.isFollowedByMe
      );
    } else if (mood === 'played_courses') {
      deduped = deduped.filter(p => !!p.courseId && personalSignals.playedCourseIds.has(p.courseId));
    }

    // Personalisation re-rank (lightweight, client-side).
    // Skip when we have no signals yet (cold start), or when the user
    // explicitly picked 'trending' (pure trending order, no personal boost).
    const hasAnySignal =
      personalSignals.playedCourseIds.size > 0 ||
      personalSignals.wantToPlayCourseIds.size > 0 ||
      personalSignals.followingUserIds.size > 0;
    const applyBoost = mood !== 'trending' && mood !== 'all' && hasAnySignal;

    let ordered = deduped;
    if (applyBoost) {
      // Stable sort: tie-break by original index so trending order is
      // preserved when nothing personalises a pair of posts.
      const withIdx = deduped.map((post, idx) => ({
        post,
        idx,
        boost: computePersonalBoost(post, personalSignals),
      }));
      withIdx.sort((a, b) => {
        if (b.boost !== a.boost) return b.boost - a.boost;
        return a.idx - b.idx;
      });
      ordered = withIdx.map(x => x.post);
    }

    // Diversity passes run AFTER personal re-rank so adjacency rules apply
    // to the final ordering the user actually sees.
    const creatorDiverse = enforceCreatorDiversity(ordered);
    return enforceCourseDiversity(creatorDiverse);
  }, [query.data, personalSignals, mood]);

  const resetSeen = useCallback(() => {
    seenPostIds.current = [];
  }, []);

  return {
    posts: allPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}