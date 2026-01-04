import React from 'react';
import { cn } from '@/lib/utils';
import { ReviewOverlayCore } from './ReviewOverlayCore';

interface ReviewTileOverlayProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  className?: string;
}

/**
 * Compact review overlay for grid tiles
 * Shows course name, location, rating pill, and "From a review" label
 * Uses shared ReviewOverlayCore for consistency with fullscreen view
 */
export const ReviewTileOverlay: React.FC<ReviewTileOverlayProps> = ({
  courseName,
  courseLocation,
  rating,
  className,
}) => {
  return (
    <ReviewOverlayCore
      courseName={courseName}
      courseLocation={courseLocation}
      rating={rating}
      variant="tile"
      className={className}
    />
  );
};

export default ReviewTileOverlay;
