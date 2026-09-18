import React from 'react';
import { InlineReviewCard } from './InlineReviewCard';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import type { FeedPost } from '@/components/media-system/types/media';
import { useQueryClient } from '@tanstack/react-query';
import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
import { prefetchReviewSheet } from '@/components/posts/prefetchReviewSheet';

interface ReviewOverlaySlotProps {
  activePost: FeedPost;
  onReviewTap: () => void;
  isVisible: boolean;
  /** When true, render the "Read review" affordance in white instead of amber. */
  whiteReadReview?: boolean;
}

/**
 * Renders the InlineReviewCard for review posts with reviewer stats
 * fetched lazily via useReviewerStats. Only mounts when activePost is a review,
 * so the hook never fires on non-review posts.
 */
export const ReviewOverlaySlot: React.FC<ReviewOverlaySlotProps> = ({
  activePost,
  onReviewTap,
  isVisible,
  whiteReadReview,
}) => {
  const { data: reviewerStats } = useReviewerStats(activePost.userId);
  const queryClient = useQueryClient();

  if (!activePost.review) return null;

  const review = activePost.review;

  return (
    <InlineReviewCard
      courseName={review.courseName}
      rating={review.rating}
      courseRegion={review.courseRegion}
      courseCountry={review.courseCountry}
      courseSubCountry={review.courseSubCountry}
      courseRating={activePost.courseRating ?? null}
      reviewText={review.reviewText ?? null}
      reviewer={{
        id: activePost.actorId ?? activePost.userId,
        name: activePost.displayName,
        avatar: activePost.avatarUrl,
      }}
      isVisible={isVisible}
      onTap={onReviewTap}
      onPressStart={() => prefetchReviewSheet(queryClient, buildReviewSheetPayload(activePost, reviewerStats ?? null))}
      breakdown={review.breakdown ?? null}
      reviewerStats={reviewerStats ?? null}
      reviewDate={activePost.createdAt}
      whiteReadReview={whiteReadReview}
    />
  );
};

export default ReviewOverlaySlot;
