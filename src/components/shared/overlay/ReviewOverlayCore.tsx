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
      {/* Tile variant - Compact Premium Glass Panel */}
      {variant === 'tile' && (
        <>
          {/* Top gradient for legibility */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/25 to-transparent" />
          {/* Bottom gradient for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          
          {/* Top glass panel - scaled for tile size */}
          <div
            className={cn(
              "absolute top-1.5 left-1.5 right-1.5 z-10",
              "rounded-lg p-1.5 backdrop-blur-md border",
              "shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.08)'
                : 'rgba(0, 0, 0, 0.5)',
              borderColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.3)'
                : 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="flex items-start justify-between gap-1.5">
              {/* Left: Course name + location */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-[10px] leading-tight line-clamp-1">
                  {courseName}
                </div>
                {courseLocation && (
                  <div className="text-white/60 text-[8px] mt-0.5 line-clamp-1">
                    {courseLocation}
                  </div>
                )}
              </div>
              
              {/* Right: Rating + pill (vertical stack) */}
              <div className="flex-shrink-0 flex flex-col items-end">
                <span 
                  className="font-bold text-sm leading-none tabular-nums"
                  style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
                >
                  {rating === 10 ? '10' : rating.toFixed(1)}
                </span>
                <RatingPill score={rating} className="text-[6px] py-0 px-1 mt-0.5" />
              </div>
            </div>
            
            {/* "From a review" label */}
            <div className="text-[7px] text-white/40 font-medium uppercase tracking-wide mt-1">
              From a review
            </div>
          </div>
          
          {/* Optional: "REVIEW" badge bottom-left (subtle) */}
          <div className="absolute bottom-1.5 left-1.5 z-10">
            <span className="text-[7px] text-white/40 font-bold uppercase tracking-wide px-1 py-0.5 bg-black/30 rounded">
              Review
            </span>
          </div>
        </>
      )}
      
      {/* Fullscreen variant - Premium Glass Panel */}
      {isFullscreen && (
        <div 
          className={cn(
            "absolute left-4 right-4 z-20 top-14",
            "rounded-xl backdrop-blur-xl border",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
            isOutstanding 
              ? "bg-[rgba(210,180,97,0.08)]" 
              : "bg-black/50"
          )}
          style={{
            borderColor: isOutstanding 
              ? 'rgba(210, 180, 97, 0.3)' 
              : 'rgba(255, 255, 255, 0.08)',
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
