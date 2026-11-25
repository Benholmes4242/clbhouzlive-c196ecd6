/**
 * engagementTargetFor — BRIEF 20 A1. The ONE engagement target of any
 * post-like item: round (posts.whs_score_id) → review (source_review_id,
 * review.reviewId or engagementTarget review) → post. Every like, like count,
 * liked-by row, comment sheet, comment count, preview and share reads this;
 * no surface works out its own target. Editorial cards keep their own
 * 'editorial' target and never come through here.
 */
export type EngagementTarget = { type: 'round' | 'review' | 'post'; id: string };

export type EngagementItem = {
  id: string;
  whsScoreId?: string | null;
  sourceReviewId?: string | null;
  review?: { reviewId?: string | null } | null;
  engagementTarget?: { type: 'post' | 'review'; id: string } | null;
};

/** `resolved` carries ids read elsewhere (e.g. usePostScoreIds) for this item. */
export function engagementTargetFor(
  item: EngagementItem,
  resolved?: { scoreId?: string | null; reviewId?: string | null },
): EngagementTarget {
  const scoreId = resolved?.scoreId ?? item.whsScoreId ?? null;
  if (scoreId) return { type: 'round', id: scoreId };
  const reviewId = resolved?.reviewId
    ?? item.sourceReviewId
    ?? (item.engagementTarget?.type === 'review' ? item.engagementTarget.id : null)
    ?? item.review?.reviewId
    ?? null;
  if (reviewId) return { type: 'review', id: reviewId };
  return { type: 'post', id: item.id };
}
