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
              "rounded-lg border",
              // Enhanced frosted glass
              "backdrop-blur-2xl",
              "shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.06)'
                : 'rgba(0, 0, 0, 0.40)',
              borderColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.25)'
                : 'rgba(255, 255, 255, 0.06)',
              padding: '6px 8px',
            }}
          >
            {/* Two-column: Left (course info) / Right (rating number only) */}
            <div className="flex justify-between items-start gap-2">
              {/* Left: Course name + location + de-emphasised pill */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-white font-bold text-[11px] leading-tight line-clamp-1">
                  {courseName}
                </div>
                {courseLocation && (
                  <div className="text-white/60 text-[9px] line-clamp-1">
                    {courseLocation}
                  </div>
                )}
                {/* Tier pill - de-emphasised */}
                <RatingPill score={rating} className="text-[5px] py-0 px-0.5 opacity-70 mt-0.5" />
              </div>
              
              {/* Right: Rating number only - top-aligned */}
              <span 
                className="text-xl font-bold tabular-nums leading-none tracking-tight flex-shrink-0"
                style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* BOTTOM PANEL - User info (matches ReviewBottomPanel) */}
          <div
            className={cn(
              "absolute bottom-2 left-2 z-10",
              "rounded-lg border",
              // Enhanced frosted glass
              "backdrop-blur-2xl",
              "shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]",
              "max-w-[70%]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.06)'
                : 'rgba(0, 0, 0, 0.40)',
              borderColor: isOutstanding
                ? 'rgba(210, 180, 97, 0.25)'
                : 'rgba(255, 255, 255, 0.06)',
              padding: '5px 8px',
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
                {/* Rating pill inline with "Rated" text */}
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
            "rounded-xl border",
            // Enhanced frosted glass: increased blur, reduced opacity
            "backdrop-blur-2xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]",
            isOutstanding 
              ? "bg-[rgba(210,180,97,0.06)]" 
              : "bg-black/40"
          )}
          style={{
            borderColor: isOutstanding 
              ? 'rgba(210, 180, 97, 0.25)' 
              : 'rgba(255, 255, 255, 0.06)',
            // Reduced padding for ~20% height reduction
            padding: '12px 16px',
          }}
        >
          {/* Two-column grid: Left (course info) / Right (rating) */}
          <div className="flex justify-between items-start gap-4">
            {/* Left Stack - Course Identity */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {/* Course Name - largest, bold */}
              <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2">
                {courseName}
              </h2>
              
              {/* Location - smaller, muted */}
              {courseLocation && (
                <p className="text-white/60 text-sm leading-snug">
                  {courseLocation}
                </p>
              )}
              
              {/* Tier Badge - de-emphasised, under course name */}
              <div className="pt-1">
                <RatingPill 
                  score={rating} 
                  className="text-[8px] py-0.5 px-1.5 opacity-75" 
                />
              </div>
              
              {/* Preview pill - under tier badge */}
              {showPreviewBadge && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/60 text-[10px] font-medium tracking-wide uppercase">
                  Preview
                </span>
              )}
            </div>
            
            {/* Right: Rating Number - top-aligned with course name */}
            <div className="flex-shrink-0">
              {/* Numeric Rating - luxury watch numerals style */}
              <span 
                className="text-4xl sm:text-5xl font-bold tabular-nums leading-none tracking-tight"
                style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewOverlayCore;
