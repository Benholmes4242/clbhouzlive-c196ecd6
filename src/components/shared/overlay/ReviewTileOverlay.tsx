import React from 'react';
import { cn } from '@/lib/utils';
import { ReviewOverlayCore } from './ReviewOverlayCore';

interface ReviewTileOverlayProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  /** User info for bottom panel */
  user?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
  className?: string;
}

/**
 * Compact review overlay for grid tiles
 * Shows top panel (course + rating) and bottom panel (user info)
 * Uses shared ReviewOverlayCore for consistency with fullscreen view
 */
export const ReviewTileOverlay: React.FC<ReviewTileOverlayProps> = ({
  courseName,
  courseLocation,
  rating,
  user,
  className,
}) => {
  return (
    <ReviewOverlayCore
      courseName={courseName}
      courseLocation={courseLocation}
      rating={rating}
      user={user}
      variant="tile"
      className={className}
    />
  );
};

export default ReviewTileOverlay;
