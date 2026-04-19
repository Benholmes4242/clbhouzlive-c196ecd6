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
 * - Bottom inline review capsule (tap → opens ReviewBottomSheet)
 */

import React, { useState, useCallback } from 'react';
import { FullscreenReviewPost, FullscreenReviewPostProps, ReviewMediaItem } from './FullscreenReviewPost';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { ReviewBottomSheet } from './ReviewBottomSheet';

interface ReviewCreator {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
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
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);

  const handleOpenSheet = useCallback(() => setIsReviewSheetOpen(true), []);
  const handleCloseSheet = useCallback(() => setIsReviewSheetOpen(false), []);

  // Build review data for capsule
  const reviewData = {
    courseId,
    courseName,
    courseLocation: heroSubtitle || '',
    rating,
    tierLabel: '',
    sourceReviewId: sourceReviewId || '',
    reviewText: reviewText || null,
    courseCountry,
    courseRegion,
    courseSubCountry,
  };

  return (
    <>
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

      <ReviewBottomSheet
        isOpen={isReviewSheetOpen}
        onClose={handleCloseSheet}
        user={creator}
        courseId={courseId}
        courseName={courseName}
        rating={rating}
        reviewId={sourceReviewId}
        courseCountry={courseCountry}
        courseRegion={courseRegion}
        courseSubCountry={courseSubCountry}
        reviewText={reviewText}
      />
    </>
  );
};

export default ReviewPostViewer;
