import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  /** Course ID for navigation - enables tappable tile */
  courseId?: string;
  /** Custom handler for course tap (overrides default navigation) */
  onCourseTap?: () => void;
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
 * - Uses Gray for Fair → Excellent (0-8.9)
 * - Uses Amber/Orange for Outstanding (9.0+)
 * 
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
const ReviewOverlayCoreInner: React.FC<ReviewOverlayCoreProps> = ({
  courseName,
  courseLocation,
  rating,
  variant,
  showPreviewBadge = false,
  user,
  courseId,
  onCourseTap,
  className,
}) => {
  const navigate = useNavigate();
  const isFullscreen = variant === 'fullscreen';
  const theme = getReviewOverlayTheme(rating);
  const isOutstanding = rating >= 9.0;
  const isTappable = !!(courseId || onCourseTap);

  // Memoize initials calculation
  const initials = useMemo(() => {
    return (user?.name || 'G')
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [user?.name]);

  // Handle tap on course info tile - memoized
  const handleCourseTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent handlers
    
    if (onCourseTap) {
      onCourseTap();
    } else if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  }, [courseId, navigate, onCourseTap]);

  // Handle tap on user info - memoized
  const handleUserTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const profileId = user?.username || user?.id;
    if (profileId) {
      navigate(`/profile/${profileId}`);
    }
  }, [navigate, user?.id, user?.username]);

  // Wrapper for making content tappable - memoized component
  // Uses <div> with role="button" to avoid invalid nested <button> elements
  // when rendered inside UnifiedMediaTile (which is already a <button>)
  const TappableWrapper = useMemo(() => {
    const Wrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className: wrapperClassName }) => {
      if (!isTappable) {
        return <div className={cn(wrapperClassName, "pointer-events-auto")}>{children}</div>;
      }
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={handleCourseTap}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCourseTap(e as unknown as React.MouseEvent);
            }
          }}
          className={cn(
            wrapperClassName,
            "w-full text-left cursor-pointer pointer-events-auto",
            "transition-transform active:scale-[0.98]"
          )}
          aria-label={`View ${courseName} details`}
        >
          {children}
        </div>
      );
    };
    return Wrapper;
  }, [isTappable, handleCourseTap, courseName]);

  // Memoize formatted rating
  const formattedRating = useMemo(() => {
    return rating === 10 ? '10' : rating.toFixed(1);
  }, [rating]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Tile variant - Lighter, refined match of fullscreen layout */}
      {variant === 'tile' && (
        <>
          {/* Subtle top gradient for legibility */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 via-black/15 to-transparent" />
          {/* Bottom gradient for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 via-black/15 to-transparent" />
          
          {/* TOP PANEL - Scaled for ~195px grid tiles */}
          <TappableWrapper className="absolute top-2 left-2 right-10 z-10">
            <div
              className={cn(
                "rounded-lg border",
                "shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
              )}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(12px) saturate(130%)',
                WebkitBackdropFilter: 'blur(12px) saturate(130%)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
                padding: '6px 8px',
              }}
            >
              {/* Two-column: Left (course info) / Right (rating) */}
              <div className="flex justify-between items-start gap-1.5">
                {/* Left: Course name + location */}
                <div className="flex-1 min-w-0 space-y-0">
                  <div className="text-white font-semibold text-[13px] leading-tight line-clamp-1">
                    {courseName}
                  </div>
                  {courseLocation && (
                    <div className="text-white/50 text-[10px] line-clamp-1 font-normal">
                      {courseLocation}
                    </div>
                  )}
                </div>
                
                {/* Right: Rating (vertical stack, compact) */}
                <div className="flex flex-col items-center gap-0 flex-shrink-0">
                  <span 
                    className="text-lg font-bold tabular-nums leading-none"
                    style={{ color: isOutstanding ? '#f59e0b' : '#c4c8ce' }}
                  >
                    {formattedRating}
                  </span>
                  <span 
                    className="text-[8px] font-medium tracking-wider truncate max-w-[48px]"
                    style={{ color: isOutstanding ? 'rgba(245, 158, 11, 0.6)' : 'rgba(196, 200, 206, 0.6)' }}
                  >
                    {theme.label}
                  </span>
                </div>
              </div>
            </div>
          </TappableWrapper>
          
          {/* BOTTOM PANEL - User info (bounded both sides) */}
          <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-auto">
            <div
              className={cn(
                "flex items-center gap-2",
                "rounded-lg border",
                "shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
              )}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(12px) saturate(130%)',
                WebkitBackdropFilter: 'blur(12px) saturate(130%)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
                padding: '6px 8px',
              }}
            >
              {/* Tappable avatar + name - navigates to profile */}
              <button
                type="button"
                onClick={handleUserTap}
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer transition-opacity active:opacity-80"
                aria-label={`View ${user?.name || 'Golfer'}'s profile`}
              >
                <SquircleAvatar
                  size={22}
                  src={user?.avatar}
                  alt={user?.name || 'Golfer'}
                  fallback={initials}
                  hideRing
                />
                <div className="text-white font-medium text-[11px] truncate leading-tight flex-1">
                  {user?.name || 'Golfer'}
                </div>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Fullscreen variant - Refined Premium Glass Panel */}
      {isFullscreen && (
        <TappableWrapper
          className={cn(
            "absolute left-4 right-4 z-20 top-[76px]",
            "rounded-xl border",
            "shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
          )}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.3) 100%)',
              backdropFilter: 'blur(16px) saturate(150%)',
              WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              padding: '12px 16px',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
                      ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' 
                      : 'transparent',
                    WebkitBackgroundClip: isOutstanding ? 'text' : 'unset',
                    WebkitTextFillColor: isOutstanding ? 'transparent' : '#c4c8ce',
                    color: isOutstanding ? 'transparent' : '#c4c8ce',
                  }}
                >
                  {formattedRating}
                </span>
                <span 
                  className="text-[9px] font-medium tracking-wider mt-0.5"
                  style={{ color: isOutstanding ? 'rgba(245, 158, 11, 0.7)' : 'rgba(196, 200, 206, 0.7)' }}
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
        </TappableWrapper>
      )}
    </div>
  );
};

// Memoize to prevent re-renders when props haven't changed
export const ReviewOverlayCore = memo(ReviewOverlayCoreInner);

export default ReviewOverlayCore;
