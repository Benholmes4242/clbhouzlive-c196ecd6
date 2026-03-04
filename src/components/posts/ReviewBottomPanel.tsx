import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import { cn } from '@/lib/utils';

// Respect reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

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
  /** Review ID for deep linking to specific review */
  reviewId?: string;
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
  reviewId,
  sourceReviewId,
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
    // Include reviewId for deep linking
    const finalReviewId = reviewId || sourceReviewId;
    const url = finalReviewId 
      ? `/courses/${courseId}?tab=reviews&review=${finalReviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  };

  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut', delay: 0.15 }}
      className={cn(
        'absolute z-50 pointer-events-auto',
        // Floating with more edge spacing, narrower
        'left-5 max-w-[260px]',
        className
      )}
      style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomOffsetPx}px)` }}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border',
          'shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
        )}
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.10)',
        }}
      >
        {/* Matches regular CreatorCapsule layout exactly */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${user.id}`);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:opacity-80 transition-opacity"
        >
          {/* Avatar - same size as regular capsule */}
          <SquircleAvatar
            size={40}
            src={user.avatar}
            alt={user.name || user.username || 'Golfer'}
            fallback={initials}
            hideRing
          />
          
          {/* Name + CTA stacked */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">
              {user.name || user.username || 'Golfer'}
            </div>
            {/* Read review CTA - same position as caption preview */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={cn(
                "flex items-center gap-0.5 mt-0.5",
                "text-[11px] font-medium",
                "transition-opacity duration-150",
                rating >= 9.0
                  ? "text-amber-400/90 hover:text-amber-300"
                  : "text-white/60 hover:text-white/80"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>Read review</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewBottomPanel;
