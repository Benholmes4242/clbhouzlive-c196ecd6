/** One actor-scoped batch per open list; registered post cache receives the same
 * engagement patches as the feed. Reviews hydrate once, including genuine nulls. */
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import { patchEngagement } from '@/lib/engagementCache';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { missingReviewScoreIds, readViewerPosts, readViewerReviewScores, viewerPostIds } from './viewerContent';

export function useViewerContent(posts: readonly FeedPost[], enabled: boolean, userId?: string, actor?: { type: string; id: string } | null) {
  const cache = useQueryClient();
  const ids = useMemo(() => viewerPostIds(posts), [posts]);
  const reviewIds = useMemo(() => missingReviewScoreIds(posts), [posts]);
  const postQuery = useQuery({
    queryKey: ['viewer-source-posts', userId, actor?.type, actor?.id, ids],
    enabled: enabled && ids.length > 0, staleTime: 0, retry: false,
    queryFn: async () => {
      const rows = await readViewerPosts(ids, userId, actor);
      for (const row of rows) patchEngagement(cache, row.id, { likeCount: row.likeCount, commentCount: row.commentCount, isLikedByMe: row.isLikedByMe }, { skipKeyPrefixes: [['viewer-source-posts']] });
      return rows;
    },
  });
  const scores = useQuery({
    queryKey: ['viewer-review-scores', userId, reviewIds],
    enabled: enabled && reviewIds.length > 0, staleTime: 60_000, retry: false,
    queryFn: () => readViewerReviewScores(reviewIds),
  });
  useEffect(() => {
    if (!enabled || !scores.data?.length) return;
    const byId = new Map(scores.data.map(row => [row.id, row.breakdown]));
    const state = useFullscreenFeedStore.getState();
    const next = state.posts.map(post => {
      const breakdown = post.review ? byId.get(post.review.reviewId) : undefined;
      return breakdown && post.review ? { ...post, review: { ...post.review, breakdown } } : post;
    });
    useFullscreenFeedStore.setState({ posts: next });
  }, [enabled, scores.data]);
  return postQuery.isError ? [] : postQuery.data ?? [];
}