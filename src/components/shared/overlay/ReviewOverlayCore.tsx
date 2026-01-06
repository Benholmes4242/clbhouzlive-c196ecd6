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
 * - fullscreen: Premium glass panel with two-column layout
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
      {/* Tile variant layout */}
      {variant === 'tile' && (
        <>
          {/* Top gradient for tile */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          
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
      
      {/* Fullscreen variant - Premium Glass Panel */}
      {isFullscreen && (
        <div 
          className="absolute left-4 right-4 z-20 top-14"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '16px',
          }}
        >
          {/* Two-column grid: Left (course info) / Right (rating) */}
          <div className="flex justify-between items-start gap-4">
            {/* Left Stack - Course Identity */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Course Name - largest, bold */}
              <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-md">
                {courseName}
              </h2>
              
              {/* Location - smaller, muted */}
              {courseLocation && (
                <p className="text-white/60 text-sm drop-shadow-sm">
                  {courseLocation}
                </p>
              )}
              
              {/* Preview pill - under location */}
              {showPreviewBadge && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-medium tracking-wide uppercase">
                  Preview
                </span>
              )}
            </div>
            
            {/* Right Stack - Rating (center-aligned vertical stack) */}
            <div className="flex flex-col items-center text-center gap-1 flex-shrink-0">
              {/* Numeric Rating - large anchor */}
              <span 
                className="text-4xl sm:text-5xl font-bold tabular-nums drop-shadow-lg leading-none"
                style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              
              {/* Tier Badge */}
              <RatingPill score={rating} className="text-[9px] py-0.5 px-2" />
              
              {/* "FROM A REVIEW" label */}
              <span className="text-[9px] font-medium text-white/40 tracking-wider uppercase mt-0.5">
                From a review
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewOverlayCore;
