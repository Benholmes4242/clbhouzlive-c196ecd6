/**
 * useViewerEngagement — CANONICAL_FULLSCREEN_VIEWER §2. Routes the fullscreen
 * viewer's like, comment count and share by the post's engagementTarget.
 *
 * Absent / 'post': the existing post paths, unchanged (useClubhouseLikes etc).
 * 'review': like count and viewer-liked come from get_story_engagement('review')
 * for every review target in the open list; the toggle goes through
 * useContentReactions.toggle('review', id) exactly as ReviewBottomSheetPortal
 * does, with a local optimistic value until the engagement window refetches.
 * The post like mutation is NEVER called for a review target. Share uses the
 * one review share (shareReview).
 */
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { engagementKeys } from '@/lib/queryKeys';
import { shareReview } from '@/lib/reviews/shareReview';
import { engagementTargetFor } from '@/lib/engagement/engagementTarget';

/** The review id a viewer post's engagement lands on, or null (post target). */
export const reviewTargetOf = (post: FeedPost | null | undefined) => {
  if (!post) return null;
  const target = engagementTargetFor(post as Parameters<typeof engagementTargetFor>[0]);
  return target.type === 'review' && (post.engagementTarget?.type === 'review' || (post as { sourceReviewId?: string | null }).sourceReviewId) ? target.id : null;
};

/** BRIEF 20 A3: a feed card's review-targeted form (review cards carry only
 *  review.reviewId), or null when its one target is not a review. */
export const reviewEngagementPost = (post: FeedPost): FeedPost | null => {
  if (reviewTargetOf(post)) return post;
  const t = engagementTargetFor(post as Parameters<typeof engagementTargetFor>[0]);
  return t.type === 'review' ? { ...post, engagementTarget: { type: 'review', id: t.id } } : null;
};

type LikeState = { isLiked: boolean; count: number };

export function useViewerEngagement(args: {
  posts: readonly FeedPost[];
  handleLike: (post: FeedPost) => void;
  getActiveLikeState: (post: FeedPost) => LikeState;
  getCommentCount: (post: FeedPost) => number;
  handleShare: (post: FeedPost) => void;
  /** BRIEF 20 A2: the resolved action post; its target wins over the display post's. */
  resolve?: (post: FeedPost) => FeedPost | null;
}) {
  const { posts, handleLike, getActiveLikeState, getCommentCount, handleShare, resolve } = args;
  const targetOf = useCallback((post: FeedPost | null | undefined) => {
    if (!post) return null;
    return reviewTargetOf(resolve?.(post) ?? null) ?? reviewTargetOf(post);
  }, [resolve]);
  const reviewTargetIds = useMemo(
    () => [...new Set(posts.map(targetOf).filter((id): id is string => !!id))].filter((id): id is string => !!id),
    [posts, targetOf],
  );
  const reviewEngagement = useStoryEngagement('review', reviewTargetIds);
  const reactionTargets = useMemo(
    () => reviewTargetIds.map((id) => ({ type: 'review' as const, id })),
    [reviewTargetIds],
  );
  const reactions = useContentReactions(reactionTargets);
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<Map<string, LikeState>>(() => new Map());

  const getViewerLikeState = useCallback((post: FeedPost): LikeState => {
    const rid = targetOf(post);
    if (!rid) return getActiveLikeState(post);
    const e = reviewEngagement.engagementFor(rid);
    return overrides.get(rid) ?? { isLiked: e.viewerLiked, count: e.likeCount };
  }, [getActiveLikeState, reviewEngagement, overrides, targetOf]);

  const handleViewerLike = useCallback((post: FeedPost) => {
    const rid = targetOf(post);
    if (!rid) { handleLike(post); return; }
    if (!reactions.viewerId || reactions.unavailable) return;
    const current = getViewerLikeState(post);
    setOverrides((prev) => new Map(prev).set(rid, {
      isLiked: !current.isLiked, count: Math.max(0, current.count + (current.isLiked ? -1 : 1)),
    }));
    reactions.toggle('review', rid, () => {
      void Promise.resolve(queryClient.invalidateQueries({ queryKey: engagementKeys.type('review') })).then(() => {
        setOverrides((prev) => { const next = new Map(prev); next.delete(rid); return next; });
      });
    });
  }, [handleLike, reactions, getViewerLikeState, queryClient, targetOf]);

  const getViewerCommentCount = useCallback((post: FeedPost) => {
    const rid = targetOf(post);
    return rid ? reviewEngagement.engagementFor(rid).commentCount : getCommentCount(post);
  }, [reviewEngagement, getCommentCount, targetOf]);

  const handleViewerShare = useCallback((post: FeedPost) => {
    const rid = targetOf(post);
    const review = post.review ?? resolve?.(post)?.review;
    if (!rid || !review) { handleShare(post); return; }
    shareReview({ reviewId: rid, courseId: review.courseId, courseName: review.courseName, authorName: post.displayName });
  }, [handleShare, targetOf, resolve]);

  /** Where the comment sheet opens for this post: the review, or null (post/round rules). */
  const commentTargetFor = useCallback((post: FeedPost | null | undefined) => {
    const rid = targetOf(post);
    return rid ? { type: 'review' as const, id: rid } : null;
  }, []);

  return { getViewerLikeState, handleViewerLike, getViewerCommentCount, handleViewerShare, commentTargetFor };
}
