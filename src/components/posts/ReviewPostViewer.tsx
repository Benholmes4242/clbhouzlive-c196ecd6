/**
 * ReviewPostViewer - Unified review post viewer component
 *
 * Single source of truth for review post rendering across:
 * - Clubhouse feed
 * - Profile Activity fullscreen
 * - Preview screen (post-submission)
 *
 * Renders:
 * - Media carousel (if renderMedia=true)
 * - Bottom inline review capsule (tap → opens ReviewBottomSheet via store)
 */

import React, { useCallback } from 'react';
import { FullscreenReviewPost, FullscreenReviewPostProps, ReviewMediaItem } from './FullscreenReviewPost';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { getRatingTierLabel } from '@/lib/ratingTier';

interface ReviewCreator {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  /** Actor type for the post — determines profile route on capsule tap. */
  actorType?: 'personal' | 'business';
  /** Actor id (business id for business-authored reviews). Falls back to id. */
  actorId?: string;
}

interface ReviewPostViewerProps extends Omit<FullscreenReviewPostProps, 'children'> {
  /**
   * User who created the review (for bottom capsule)
   */
  creator: ReviewCreator;

  /**
   * Review ID for deep linking to full review
   */
  sourceReviewId?: string;

  /**
   * Review text content for the verdict card
   */
  reviewText?: string | null;

  /**
   * Course location parts (for sheet location row)
   */
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;

  /**
   * Whether to show the bottom review capsule
   * Set to false for preview mode (shows CTA bar instead)
   */
  showReviewCapsule?: boolean;

  /**
   * Custom children (e.g., CTA bar for preview mode)
   */
  children?: React.ReactNode;
}

export const ReviewPostViewer: React.FC<ReviewPostViewerProps> = ({
  creator,
  courseId,
  courseName,
  heroSubtitle,
  sourceReviewId,
  reviewText,
  courseCountry = null,
  courseRegion = null,
  courseSubCountry = null,
  showReviewCapsule = true,
  children,
  mode,
  rating,
  ...fullscreenProps
}) => {
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const { data: reviewerStats } = useReviewerStats(creator.id);

  const handleOpenSheet = useCallback(() => {
    openReviewSheet({
      user: {
        id: creator.id,
        name: creator.name,
        username: creator.username,
        avatar: creator.avatar,
      },
      courseId,
      courseName,
      rating,
      reviewId: sourceReviewId,
      courseCountry,
      courseRegion,
      courseSubCountry,
      reviewText,
      reviewerStats: reviewerStats ?? null,
    });
  }, [
    openReviewSheet,
    creator,
    courseId,
    courseName,
    rating,
    sourceReviewId,
    courseCountry,
    courseRegion,
    courseSubCountry,
    reviewText,
    reviewerStats,
  ]);

  // Build review data for capsule
  const reviewData = {
    courseId,
    courseName,
    courseLocation: heroSubtitle || '',
    rating,
    tierLabel: getRatingTierLabel(rating),
    sourceReviewId: sourceReviewId || '',
    reviewText: reviewText || null,
    courseCountry,
    courseRegion,
    courseSubCountry,
  };

  return (
    <FullscreenReviewPost
      mode={mode}
      courseId={courseId}
      courseName={courseName}
      heroSubtitle={heroSubtitle}
      rating={rating}
      user={creator}
      {...fullscreenProps}
    >
      {/* Bottom review capsule - only show in live mode when enabled */}
      {showReviewCapsule && mode === 'live' && (
        <CreatorCapsule
          user={creator}
          isReview={true}
          reviewData={reviewData as any}
          onReviewTap={handleOpenSheet}
          isVisible={true}
          // Required props (not shown in review mode)
          caption=""
          golfCourse={null}
          isFollowing={false}
          isOwnPost={false}
        />
      )}

      {/* Custom children (e.g., preview CTA bar) */}
      {children}
    </FullscreenReviewPost>
  );
};

export default ReviewPostViewer;
