import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RatingPill } from '@/components/ui/RatingPill';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import { cn } from '@/lib/utils';

interface ReviewBottomPanelUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface ReviewBottomPanelProps {
  user: ReviewBottomPanelUser;
  courseId: string;
  rating: number;
  sourceReviewId?: string;
  onReadFullReview?: () => void;
  /** Additional offset from bottom (in px), used to clear sticky CTA bars. */
  bottomOffsetPx?: number;
  className?: string;
}

/**
 * ReviewBottomPanel
 *
 * Bottom overlay for fullscreen review posts that works inside dialogs/modals.
 * Uses absolute positioning (unlike CreatorCapsule which is fixed).
 */
export const ReviewBottomPanel: React.FC<ReviewBottomPanelProps> = ({
  user,
  courseId,
  rating,
  onReadFullReview,
  bottomOffsetPx = 100,
  className,
}) => {
  const navigate = useNavigate();
  const theme = getReviewOverlayTheme(rating);

  const initials = (user.name || user.username || 'G')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleClick = () => {
    if (onReadFullReview) return onReadFullReview();
    navigate(`/courses/${courseId}?tab=reviews`);
  };

  return (
    <div
      className={cn(
        'absolute left-4 z-50 pointer-events-auto',
        // Match CreatorCapsule review width (leaves room for right-side UI in some contexts)
        'w-[calc(100vw-32px-88px)] max-w-[360px]',
        className
      )}
      style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomOffsetPx}px)` }}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border',
          // Enhanced frosted glass: increased blur, softer shadow
          'backdrop-blur-2xl',
          'shadow-[0_6px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]'
        )}
        style={{
          backgroundColor: rating >= 9 
            ? 'rgba(210, 180, 97, 0.06)' 
            : 'rgba(0, 0, 0, 0.40)',
          borderColor: rating >= 9 
            ? 'rgba(210, 180, 97, 0.25)' 
            : 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex flex-col gap-2.5 p-3">
          {/* Top row: Avatar + Name + "Rated this course" */}
          <div className="flex items-center gap-2.5">
            <SquircleAvatar
              size={40}
              src={user.avatar}
              alt={user.name || user.username || 'Golfer'}
              fallback={initials}
              hideRing
            />

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: theme.overlayText }}>
                {user.name || user.username || 'Golfer'}
              </div>
              <div className="mt-0.5">
                <span className="text-xs" style={{ color: theme.overlayText, opacity: 0.7 }}>
                  Rated this course
                </span>
              </div>
            </div>
          </div>

          {/* Bottom row: Rating Pill + CTA inline */}
          <div className="flex items-center gap-2">
            {/* Rating Pill - left side */}
            <RatingPill score={rating} className="text-[8px] py-0.5 px-1.5 flex-shrink-0" />
            
            {/* CTA - refined styling: reduced radius, softer shadow */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={cn(
                'flex-1 rounded-lg py-2 px-3',
                'flex items-center justify-center gap-1.5',
                'font-semibold text-sm',
                'transition-colors duration-200',
                // Reduced shadow for more refined look
                'shadow-sm'
              )}
              style={{
                backgroundColor: rating >= 9 ? theme.pillText : 'rgba(255, 255, 255, 0.12)',
                color: rating >= 9 ? '#000000' : theme.overlayText,
              }}
            >
              <span>Read full review</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewBottomPanel;
