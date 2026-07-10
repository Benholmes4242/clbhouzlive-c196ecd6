import type { FeedPost } from '@/components/media-system/types/media';
import type { ReviewSheetPayload, ReviewSheetReviewerStats } from '@/stores/reviewSheetStore';

/**
 * Shared builder for the ReviewBottomSheet payload.
 *
 * Single source of truth used by BOTH entry points:
 *   1. Card "Read review ›" tap (FeedCard / LightFeedCard)
 *   2. Fullscreen viewer chrome tap (FullscreenFeedOverlay)
 *
 * Returns null when the post is not a review or lacks the minimum
 * course/rating fields the sheet needs to render.
 */
export function buildReviewSheetPayload(
  post: FeedPost,
  reviewerStats: ReviewSheetReviewerStats | null = null,
): ReviewSheetPayload | null {
  const review = post.review;
  if (!post.isReview || !review) return null;

  const courseId = review.courseId ?? post.courseId ?? '';
  if (!courseId) return null;

  return {
    user: {
      id: post.userId ?? '',
      name: post.displayName ?? '',
      username: post.username,
      avatar: post.avatarUrl,
    },
    courseId,
    courseName: review.courseName ?? post.courseName ?? '',
    rating: review.rating ?? 0,
    reviewId: review.reviewId,
    courseCountry: review.courseCountry,
    courseRegion: review.courseRegion,
    courseSubCountry: review.courseSubCountry,
    reviewText: review.reviewText,
    breakdown: (review as { breakdown?: ReviewSheetPayload['breakdown'] }).breakdown ?? null,
    reviewerStats,
  };
}
