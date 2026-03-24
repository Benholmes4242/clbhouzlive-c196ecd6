/**
 * ReviewPostViewer - Unified review post viewer component
 * 
 * Single source of truth for review post rendering across:
 * - Clubhouse feed
 * - Profile Activity fullscreen
 * - Preview screen (post-submission)
 * 
 * Renders:
 * - Top overlay (course name, rating, tier pill)
 * - Media carousel (if renderMedia=true)
 * - Bottom review capsule (avatar, "Read full review" CTA)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FullscreenReviewPost, FullscreenReviewPostProps, ReviewMediaItem } from './FullscreenReviewPost';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';

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
  showReviewCapsule = true,
  children,
  mode,
  rating,
  ...fullscreenProps
}) => {
  const navigate = useNavigate();
  
  // Build review data for capsule
  const reviewData = {
    courseId,
    courseName,
    courseLocation: heroSubtitle || '',
    rating,
    tierLabel: '', // Computed by theme function in CreatorCapsule
    sourceReviewId: sourceReviewId || '',
  };
  
  // Handle "Read full review" tap - navigate to course reviews tab with reviewId
  const handleReadFullReview = () => {
    const url = sourceReviewId 
      ? `/courses/${courseId}?tab=reviews&review=${sourceReviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
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
          reviewData={reviewData}
          onReviewTap={handleReadFullReview}
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
