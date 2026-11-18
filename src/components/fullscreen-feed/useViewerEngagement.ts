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

/** The review id a viewer post's engagement lands on, or null (post target). */
export const reviewTargetOf = (post: FeedPost | null | undefined) =>
  post?.engagementTarget?.type === 'review' ? post.engagementTarget.id : null;

type LikeState = { isLiked: boolean; count: number };

export function useViewerEngagement(args: {
  posts: readonly FeedPost[];
  handleLike: (post: FeedPost) => void;
  getActiveLikeState: (post: FeedPost) => LikeState;
  getCommentCount: (post: FeedPost) => number;
  handleShare: (post: FeedPost) => void;
}) {
  const { posts, handleLike, getActiveLikeState, getCommentCount, handleShare } = args;
  const reviewTargetIds = useMemo(
    () => posts.map(reviewTargetOf).filter((id): id is string => !!id),
    [posts],
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
    const rid = reviewTargetOf(post);
    if (!rid) return getActiveLikeState(post);
    const e = reviewEngagement.engagementFor(rid);
    return overrides.get(rid) ?? { isLiked: e.viewerLiked, count: e.likeCount };
  }, [getActiveLikeState, reviewEngagement, overrides]);

  const handleViewerLike = useCallback((post: FeedPost) => {
    const rid = reviewTargetOf(post);
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
  }, [handleLike, reactions, getViewerLikeState, queryClient]);

  const getViewerCommentCount = useCallback((post: FeedPost) => {
    const rid = reviewTargetOf(post);
    return rid ? reviewEngagement.engagementFor(rid).commentCount : getCommentCount(post);
  }, [reviewEngagement, getCommentCount]);

  const handleViewerShare = useCallback((post: FeedPost) => {
    const rid = reviewTargetOf(post);
    if (!rid || !post.review) { handleShare(post); return; }
    shareReview({ reviewId: rid, courseId: post.review.courseId, courseName: post.review.courseName, authorName: post.displayName });
  }, [handleShare]);

  /** Where the comment sheet opens for this post: the review, or null (post/round rules). */
  const commentTargetFor = useCallback((post: FeedPost | null | undefined) => {
    const rid = reviewTargetOf(post);
    return rid ? { type: 'review' as const, id: rid } : null;
  }, []);

  return { getViewerLikeState, handleViewerLike, getViewerCommentCount, handleViewerShare, commentTargetFor };
}
