/**
 * The Clubhouse comments sheet target for ONE post — the tapped post.
 * Precedence: editorial, then round (score id), then review, then post.
 * Moved verbatim from Clubhouse.tsx so the derivation is testable without
 * mounting the page.
 */
import type { FeedPost } from '@/components/media-system/types/media';

export type CommentTargetType = 'editorial' | 'round' | 'review' | 'post';

export function commentTargetFor(
  post: FeedPost,
  scoreIds: { get(postId: string): string | null | undefined },
): { targetType: CommentTargetType; targetId: string } {
  const isEditorial = post.postType === 'course_of_week_card';
  const editorialId = isEditorial
    ? (post as { cardData?: { cardId?: string } }).cardData?.cardId ?? null
    : null;
  const scoreId = scoreIds.get(post.id) ?? null;
  const reviewId = post.review?.reviewId ?? null;
  const targetType: CommentTargetType = isEditorial ? 'editorial' : scoreId ? 'round' : reviewId ? 'review' : 'post';
  const targetId = isEditorial ? (editorialId ?? '') : (scoreId ?? reviewId ?? post.id);
  return { targetType, targetId };
}
