import React from 'react';
import { cn } from '@/lib/utils';
import { RatingPill } from '@/components/ui/RatingPill';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export type ReviewOverlayVariant = 'fullscreen' | 'tile';

export interface ReviewOverlayCoreProps {
  courseName: string;
  courseLocation?: string;
  rating: number;
  /** 'fullscreen' for Clubhouse/Preview, 'tile' for grid thumbnails */
  variant: ReviewOverlayVariant;
  /** Show "Preview" badge (fullscreen only) */
  showPreviewBadge?: boolean;
  /** User info for bottom panel (tile variant) */
  user?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
  className?: string;
}

/**
 * Shared review overlay component - single source of truth for review post overlays.
 * Used by: FullscreenReviewPost, ReviewTileOverlay (grid), Profile fullscreen
 * 
 * Variants:
 * - fullscreen: Premium glass panel with two-column layout
 * - tile: Scaled-down version matching fullscreen layout exactly (top + bottom panels)
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
  user,
  className,
}) => {
  const isFullscreen = variant === 'fullscreen';
  const theme = getReviewOverlayTheme(rating);
  const isOutstanding = rating >= 9.0;

  // User initials for avatar fallback
  const initials = (user?.name || user?.username || 'G')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Tile variant - Exact match of fullscreen layout, scaled down */}
      {variant === 'tile' && (
        <>
          {/* Top gradient for legibility */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          {/* Bottom gradient for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          
          {/* TOP PANEL - Course info + Rating (matches fullscreen top panel) */}
          <div
            className={cn(
              "absolute top-2 left-2 right-2 z-10",
              "rounded-lg backdrop-blur-xl border",
              "shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.08)'
                : 'rgba(0, 0, 0, 0.5)',
              borderColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.3)'
                : 'rgba(255, 255, 255, 0.08)',
              padding: '8px',
            }}
          >
            {/* Two-column: Left (course info) / Right (rating) */}
            <div className="flex justify-between items-start gap-2">
              {/* Left: Course name + location */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-white font-bold text-[11px] leading-tight line-clamp-1 drop-shadow-md">
                  {courseName}
                </div>
                {courseLocation && (
                  <div className="text-white/60 text-[9px] line-clamp-1">
                    {courseLocation}
                  </div>
                )}
              </div>
              
              {/* Right: Rating + pill (vertical stack) */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <span 
                  className="text-xl font-bold tabular-nums leading-none drop-shadow-lg"
                  style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
                >
                  {rating === 10 ? '10' : rating.toFixed(1)}
                </span>
                <RatingPill score={rating} className="text-[6px] py-0 px-1" />
              </div>
            </div>
          </div>
          
          {/* BOTTOM PANEL - User info (matches ReviewBottomPanel) */}
          <div
            className={cn(
              "absolute bottom-2 left-2 z-10",
              "rounded-lg backdrop-blur-xl border",
              "shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
              "max-w-[70%]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.08)'
                : 'rgba(0, 0, 0, 0.5)',
              borderColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.3)'
                : 'rgba(255, 255, 255, 0.08)',
              padding: '6px 8px',
            }}
          >
            <div className="flex items-center gap-1.5">
              <SquircleAvatar
                size={20}
                src={user?.avatar}
                alt={user?.name || user?.username || 'Golfer'}
                fallback={initials}
                hideRing
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-[9px] truncate leading-tight">
                  {user?.name || user?.username || 'Golfer'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-white/60 text-[7px]">Rated</span>
                  <RatingPill score={rating} className="text-[5px] py-0 px-0.5" />
                </div>
              </div>
            </div>
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
