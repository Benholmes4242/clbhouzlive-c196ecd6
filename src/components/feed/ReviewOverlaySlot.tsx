import React from 'react';
import { InlineReviewCard } from './InlineReviewCard';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import type { FeedPost } from '@/components/media-system/types/media';

interface ReviewOverlaySlotProps {
  activePost: FeedPost;
  onReviewTap: () => void;
  isVisible: boolean;
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
    />
  );
};

export default ReviewOverlaySlot;
