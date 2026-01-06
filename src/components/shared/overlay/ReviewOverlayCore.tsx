import React from 'react';
import { cn } from '@/lib/utils';
import { RatingPill } from '@/components/ui/RatingPill';
import { getReviewOverlayTheme } from '@/lib/postHelpers';

export type ReviewOverlayVariant = 'fullscreen' | 'tile';

export interface ReviewOverlayCoreProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  /** 'fullscreen' for Clubhouse/Preview, 'tile' for grid thumbnails */
  variant: ReviewOverlayVariant;
  /** Show "Preview" badge (fullscreen only) */
  showPreviewBadge?: boolean;
  className?: string;
}

/**
 * Shared review overlay component - single source of truth for review post overlays.
 * Used by: FullscreenReviewPost, ReviewTileOverlay (grid), Profile fullscreen
 * 
 * Variants:
 * - fullscreen: Larger text, more spacing, optional preview badge
 * - tile: Compact sizing for grid thumbnails
 * 
 * Theme:
 * - Uses Slate for Fair → Excellent (0-8.9)
 * - Uses Gold for Outstanding (9.0+)
 */
export const ReviewOverlayCore: React.FC<ReviewOverlayCoreProps> = ({
  courseName,
  courseLocation,
  rating,
  variant,
  showPreviewBadge = false,
  className,
}) => {
  const isFullscreen = variant === 'fullscreen';
  const theme = getReviewOverlayTheme(rating);
  const isOutstanding = rating >= 9.0;
  
  // Typography + spacing based on variant
  const courseNameClass = isFullscreen 
    ? 'text-lg font-semibold leading-tight line-clamp-2' 
    : 'text-xs font-semibold leading-tight line-clamp-2';
  
  const locationClass = isFullscreen 
    ? 'text-sm mt-0.5' 
    : 'text-[10px] mt-0.5 line-clamp-1';
  
  const ratingClass = isFullscreen 
    ? 'text-2xl sm:text-3xl font-bold tabular-nums' 
    : 'text-lg font-bold tabular-nums';
  
  const pillClass = isFullscreen 
    ? 'text-[9px] sm:text-[10px] py-0.5 px-1.5 sm:px-2' 
    : 'text-[8px] py-0.5 px-1.5';
  
  const labelClass = isFullscreen 
    ? 'text-[9px] sm:text-[10px] font-medium tracking-wide whitespace-nowrap' 
    : 'text-[8px] font-medium tracking-wide whitespace-nowrap';
  
  const topPadding = isFullscreen ? 'top-4' : 'top-2';
  const sidePadding = isFullscreen ? 'left-4 right-20' : 'left-2 right-12';
  const rightPadding = isFullscreen ? 'right-4' : 'right-2';

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Top gradient for text legibility */}
      <div className={cn(
        "absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent",
        isFullscreen ? "h-28" : "h-16"
      )} />
      
      {/* Top-left: Course name + location + optional preview badge */}
      <div className={cn("absolute z-20", topPadding, sidePadding)}>
        <p className={cn("text-white drop-shadow-md", courseNameClass)}>
          {courseName}
        </p>
        {courseLocation && (
          <p className={cn("text-white/80 drop-shadow-sm", locationClass)}>
            {courseLocation}
          </p>
        )}
        {/* Preview pill - fullscreen only */}
        {isFullscreen && showPreviewBadge && (
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-medium tracking-wide">
            Preview
          </span>
        )}
      </div>
      
      {/* Top-right: Rating + tier + "From a review" - centered stack */}
      <div className={cn(
        "absolute z-20 flex flex-col items-center text-center gap-0.5",
        topPadding,
        rightPadding,
        isFullscreen ? "max-w-[100px]" : ""
      )}>
        <span 
          className={cn("drop-shadow-lg", ratingClass)}
          style={{ color: isOutstanding ? theme.pillText : '#FFFFFF' }}
        >
          {rating === 10 ? '10' : rating.toFixed(1)}
        </span>
        <RatingPill score={rating} className={pillClass} />
        <span className={cn("text-white/70 drop-shadow-sm", labelClass)}>
          From a review
        </span>
      </div>
    </div>
  );
};

export default ReviewOverlayCore;
