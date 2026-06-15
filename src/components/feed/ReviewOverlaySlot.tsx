import React from 'react';
import { InlineReviewCard } from './InlineReviewCard';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import type { FeedPost } from '@/components/media-system/types/media';

interface ReviewOverlaySlotProps {
  activePost: FeedPost;
  onReviewTap: () => void;
  isVisible: boolean;
  /** When true, render the "Read review" affordance in white instead of amber. */
  whiteReadReview?: boolean;
  /** When provided, render an amber follow "+" badge on the reviewer avatar
   *  (fullscreen overlay only — Clubhouse omits this). */
  followBadge?: {
    isFollowing: boolean;
    isOwnPost: boolean;
    onFollow: () => void;
  };
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
  followBadge,
}) => {
  const { data: reviewerStats } = useReviewerStats(activePost.userId);

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
        name: activePost.displayName,
        avatar: activePost.avatarUrl,
      }}
      isVisible={isVisible}
      onTap={onReviewTap}
      breakdown={review.breakdown ?? null}
      reviewerStats={reviewerStats ?? null}
      reviewDate={activePost.createdAt}
      whiteReadReview={whiteReadReview}
      followBadge={followBadge}
    />
  );
};

export default ReviewOverlaySlot;
