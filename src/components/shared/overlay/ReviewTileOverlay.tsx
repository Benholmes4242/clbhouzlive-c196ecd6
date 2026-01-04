import React from 'react';
import { cn } from '@/lib/utils';
import { RatingPill } from '@/components/ui/RatingPill';

interface ReviewTileOverlayProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  className?: string;
}

/**
 * Compact review overlay for grid tiles
 * Shows course name, location, rating pill, and "From a review" label
 */
export const ReviewTileOverlay: React.FC<ReviewTileOverlayProps> = ({
  courseName,
  courseLocation,
  rating,
  className,
}) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Top gradient for text legibility */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
      
      {/* Top-left: Course name + location */}
      <div className="absolute top-2 left-2 right-12 z-20">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2 drop-shadow-md">
          {courseName}
        </p>
        {courseLocation && (
          <p className="text-white/70 text-[10px] mt-0.5 line-clamp-1 drop-shadow-sm">
            {courseLocation}
          </p>
        )}
      </div>
      
      {/* Top-right: Rating + tier + label */}
      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-0.5">
        <span className="text-white text-lg font-bold tabular-nums drop-shadow-lg">
          {rating === 10 ? '10' : rating.toFixed(1)}
        </span>
        <RatingPill score={rating} className="text-[8px] py-0.5 px-1.5" />
        <span className="text-white/60 text-[8px] font-medium tracking-wide whitespace-nowrap drop-shadow-sm">
          From a review
        </span>
      </div>
    </div>
  );
};

export default ReviewTileOverlay;
