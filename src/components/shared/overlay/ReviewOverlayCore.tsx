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

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Top gradient - lighter for premium look (40% opacity, not 80%) */}
      <div className={cn(
        "absolute inset-x-0 top-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent",
        isFullscreen ? "h-40" : "h-16"
      )} />
      
      {/* Tile variant layout */}
      {variant === 'tile' && (
        <>
          {/* Top-left: Course name only (truncated) */}
          <div className="absolute top-2 left-2 right-2 z-10">
            <div className="text-white font-bold text-xs leading-tight line-clamp-1 drop-shadow-md">
              {courseName}
            </div>
          </div>
          
          {/* Bottom-right: Rating + pill */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
            <span className="text-white font-bold text-sm tabular-nums drop-shadow-lg">
              {rating === 10 ? '10' : rating.toFixed(1)}
            </span>
            <RatingPill score={rating} className="text-[8px] py-0.5 px-1.5" />
          </div>
          
          {/* Bottom-left: "Review" micro-label */}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[9px] text-white/50 font-medium uppercase tracking-wide drop-shadow-sm">
              Review
            </span>
          </div>
        </>
      )}
      
      {/* Fullscreen variant layout */}
      {isFullscreen && (
        <>
          {/* Top-left: Course name + location + optional preview badge */}
          <div className="absolute left-4 right-20 z-20 top-16">
            {/* Preview pill - above course name */}
            {showPreviewBadge && (
              <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 backdrop-blur-sm text-blue-200 text-[10px] font-semibold tracking-wide uppercase">
                Preview
              </span>
            )}
            <p className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-md">
              {courseName}
            </p>
            {courseLocation && (
              <p className="text-white/70 text-sm mt-1 drop-shadow-sm">
                {courseLocation}
              </p>
            )}
          </div>
          
          {/* Top-right: Rating + tier + "From a review" - centered stack */}
          <div className="absolute right-4 z-20 top-16 flex flex-col items-center text-center gap-1.5">
            <span 
              className="text-5xl sm:text-6xl font-bold tabular-nums drop-shadow-lg"
              style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
            >
              {rating === 10 ? '10' : rating.toFixed(1)}
            </span>
            <RatingPill score={rating} className="text-[9px] sm:text-[10px] py-0.5 px-2" />
            <span className="text-[10px] font-medium text-white/50 tracking-wider uppercase">
              From a review
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewOverlayCore;
