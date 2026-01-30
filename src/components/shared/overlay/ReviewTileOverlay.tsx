import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { ReviewOverlayCore } from './ReviewOverlayCore';

interface ReviewTileOverlayProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  /** User info for bottom panel */
  user?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  /** Course ID for navigation - enables tappable tile */
  courseId?: string;
  /** Custom handler for course tap (overrides default navigation) */
  onCourseTap?: () => void;
  className?: string;
}

/**
 * Compact review overlay for grid tiles
 * Shows top panel (course + rating) and bottom panel (user info)
 * Uses shared ReviewOverlayCore for consistency with fullscreen view
 * 
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
const ReviewTileOverlayInner: React.FC<ReviewTileOverlayProps> = ({
  courseName,
  courseLocation,
  rating,
  user,
  courseId,
  onCourseTap,
  className,
}) => {
  return (
    <ReviewOverlayCore
      courseName={courseName}
      courseLocation={courseLocation}
      rating={rating}
      user={user}
      variant="tile"
      courseId={courseId}
      onCourseTap={onCourseTap}
      className={className}
    />
  );
};

// Memoize to prevent re-renders when props haven't changed
export const ReviewTileOverlay = memo(ReviewTileOverlayInner);

export default ReviewTileOverlay;
