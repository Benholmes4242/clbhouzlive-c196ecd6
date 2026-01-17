import React from 'react';
import { cn } from '@/lib/utils';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronRight } from 'lucide-react';

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

  // User initials for avatar fallback - use display name only, never username
  const initials = (user?.name || 'G')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Tile variant - Lighter, refined match of fullscreen layout */}
      {variant === 'tile' && (
        <>
          {/* Subtle top gradient for legibility */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          {/* Bottom gradient for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 via-black/15 to-transparent" />
          
          {/* TOP LEFT - Course name */}
          <div className="absolute top-3 left-3 z-10 max-w-[70%]">
            <div className="text-white font-semibold text-xs leading-tight line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {courseName}
            </div>
            {courseLocation && (
              <div className="text-white/70 text-[10px] line-clamp-1 font-normal mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {courseLocation}
              </div>
            )}
          </div>
          
          {/* TOP RIGHT - Rating badge (like review posts) */}
          <div
            className={cn(
              "absolute top-3 right-3 z-10",
              "rounded-md border",
              "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
              "px-2 py-1"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(251, 191, 36, 0.15)'
                : 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderColor: isOutstanding
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <span 
              className="text-base font-bold tabular-nums leading-none"
              style={{ color: isOutstanding ? '#fbbf24' : '#ffffff' }}
            >
              {rating === 10 ? '10' : rating.toFixed(1)}
            </span>
          </div>
          
          {/* BOTTOM PANEL - Refined: lighter, smaller, floating feel */}
          <div
            className={cn(
              "absolute bottom-2.5 left-2.5 z-10",
              "rounded-lg border",
              "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
              "max-w-[65%]"
            )}
            style={{
              backgroundColor: isOutstanding
                ? 'rgba(251, 191, 36, 0.05)'
                : 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(12px) saturate(130%)',
              WebkitBackdropFilter: 'blur(12px) saturate(130%)',
              borderColor: isOutstanding
                ? 'rgba(251, 191, 36, 0.15)'
                : 'rgba(255, 255, 255, 0.06)',
              padding: '5px 7px',
            }}
          >
            {/* User info row + Read review CTA - matches CreatorCapsule layout */}
            <div className="flex items-center gap-1.5">
              <SquircleAvatar
                size={18}
                src={user?.avatar}
                alt={user?.name || 'Golfer'}
                fallback={initials}
                hideRing
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-[8px] truncate leading-tight">
                  {user?.name || 'Golfer'}
                </div>
                {/* Read review CTA - always shown for review posts */}
                <div className={cn(
                  "flex items-center gap-0.5 mt-px",
                  "text-[7px] font-medium",
                  isOutstanding 
                    ? "text-amber-400/80"
                    : "text-white/50"
                )}>
                  <span>Read review</span>
                  <ChevronRight className="w-2 h-2" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Fullscreen variant - Refined Premium Glass Panel */}
      {isFullscreen && (
        <div 
          className={cn(
            "absolute left-4 right-4 z-20 top-14",
            "rounded-xl border",
            "shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
          )}
          style={{
            background: isOutstanding 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.3) 100%)',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            borderColor: isOutstanding 
              ? 'rgba(251, 191, 36, 0.2)' 
              : 'rgba(255, 255, 255, 0.08)',
            padding: '12px 16px',
          }}
        >
          {/* ROW 1: Course Name + Rating Number (compact) */}
          <div className="flex justify-between items-start gap-3">
            {/* Left: Course Name */}
            <h2 className="flex-1 min-w-0 text-white font-semibold text-base sm:text-lg leading-tight line-clamp-2">
              {courseName}
            </h2>
            
            {/* Right: Rating Number + tier label */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
              <span 
                className="text-3xl sm:text-4xl font-bold tabular-nums leading-none"
                style={{ 
                  background: isOutstanding 
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                    : 'transparent',
                  WebkitBackgroundClip: isOutstanding ? 'text' : 'unset',
                  WebkitTextFillColor: isOutstanding ? 'transparent' : '#c4c8ce',
                  color: isOutstanding ? 'transparent' : '#c4c8ce',
                }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-[9px] font-medium tracking-wider mt-0.5"
                style={{ color: isOutstanding ? 'rgba(251, 191, 36, 0.7)' : 'rgba(196, 200, 206, 0.7)' }}
              >
                {theme.label}
              </span>
            </div>
          </div>
          
          {/* ROW 2: Location + Preview badge */}
          <div className="flex justify-between items-start gap-4 mt-1">
            <div className="flex-1 min-w-0">
              {courseLocation && (
                <p className="text-white/50 text-xs font-normal">
                  {courseLocation}
                </p>
              )}
              
              {showPreviewBadge && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[9px] font-medium tracking-wide uppercase">
                  Preview
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewOverlayCore;
