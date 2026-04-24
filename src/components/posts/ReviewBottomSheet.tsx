import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const AMBER = '#f59e0b';

export interface ReviewBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string | null;
  };
  courseId: string;
  courseName: string;
  rating: number;
  reviewId?: string | null;
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
}

export const ReviewBottomSheet: React.FC<ReviewBottomSheetProps> = ({
  isOpen,
  onClose,
  user,
  courseId,
  courseName,
  rating,
  reviewId,
  courseCountry,
  courseRegion,
  courseSubCountry,
  reviewText,
}) => {
  const navigate = useNavigate();

  const handleVisitCourse = useCallback(() => {
    if (!courseId) return;
    onClose();
    navigate(`/courses/${courseId}`);
  }, [courseId, navigate, onClose]);

  const handleGoToReview = useCallback(() => {
    if (!courseId) return;
    onClose();
    const url = reviewId
      ? `/courses/${courseId}?tab=reviews&review=${reviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  }, [courseId, reviewId, navigate, onClose]);

  const locationParts = [
    courseSubCountry || courseRegion,
    courseCountry,
  ].filter(Boolean);
  const locationStr = locationParts.join(', ');

  const initials = user.name
    .split(/[\s.]/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const formattedRating = rating === 10 ? '10' : rating.toFixed(1);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="review-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.5)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="review-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-sheet-title"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.velocity.y > 300 || info.offset.y > 120) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 0,
              zIndex: 101,
              borderRadius: '20px 20px 0 0',
              background: '#0F172A',
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderBottom: 'none',
            }}
          >
            {/* Visually-hidden accessible title for screen readers */}
            <span
              id="review-sheet-title"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              Review of {courseName} by {user.name}
            </span>

            {/* Amber accent bar */}
            <div style={{
              height: 2.5,
              background: `linear-gradient(90deg, ${AMBER}CC, transparent)`,
              borderRadius: '20px 20px 0 0',
              flexShrink: 0,
            }} />

            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
              <div style={{
                width: 36, height: 4, borderRadius: 999,
                background: 'rgba(255,255,255,0.20)',
              }} />
            </div>

            {/* Scrollable body */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '16px 20px 0',
              position: 'relative',
            }}>
              {/* Score watermark — Verdict Card signature */}
              <div style={{
                position: 'absolute',
                top: -20,
                right: -8,
                fontSize: 160,
                fontWeight: 900,
                color: 'rgba(245,158,11,0.055)',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                userSelect: 'none',
                pointerEvents: 'none',
                fontFamily: 'Georgia, serif',
              }}>
                {formattedRating}
              </div>

              {/* Content — above watermark */}
              <div style={{ position: 'relative' }}>
                {/* Rating — absolute top-right */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 2,
                  fontFamily: 'Georgia, serif',
                  zIndex: 2,
                }}>
                  <span style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#ffffff',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}>
                    {formattedRating}
                  </span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.38)',
                    fontFamily: 'inherit',
                  }}>
                    /10
                  </span>
                </div>

                {/* Course name — serif headline */}
                <div style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  fontFamily: 'Georgia, serif',
                  marginBottom: 6,
                  paddingRight: 76,
                }}>
                  {courseName}
                </div>

                {/* Location */}
                {locationStr && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 14,
                  }}>
                    <MapPin size={12} color="rgba(255,255,255,0.35)" />
                    <span style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.38)',
                    }}>
                      {locationStr}
                    </span>
                  </div>
                )}

                {/* Divider — amber fade */}
                <div style={{
                  height: 0.5,
                  background: `linear-gradient(90deg, rgba(245,158,11,0.3) 0%, transparent 80%)`,
                  marginBottom: 14,
                }} />

                {/* Reviewer row — avatar + (name + ★ COURSE REVIEW badge) / sub */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}>
                  <SquircleAvatar
                    size={36}
                    src={user.avatar}
                    alt={user.name}
                    fallback={initials}
                    hideRing
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.2,
                    }}>
                      {user.name}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(245,158,11,0.12)',
                      border: '0.5px solid rgba(245,158,11,0.35)',
                      borderRadius: 6,
                      padding: '3px 7px',
                      fontSize: 9,
                      fontWeight: 700,
                      color: AMBER,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}>
                      ★ Course Review
                    </span>
                  </div>
                </div>

                {/* Review text */}
                {reviewText && (
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.42)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: 10,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}>
                    "{reviewText}"
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{
              display: 'flex', gap: 12,
              padding: '14px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              borderTop: '1px solid rgba(245,158,11,0.1)',
              flexShrink: 0,
            }}>
            {courseId && (
              <>
              <button
                onClick={handleVisitCourse}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '13px 16px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Visit Course
              </button>
              <button
                onClick={handleGoToReview}
                style={{
                  flex: 1,
                  background: AMBER,
                  border: 'none',
                  borderRadius: 14,
                  padding: '13px 16px',
                  color: '#0d0904',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.25)',
                }}
              >
                Go to Review
              </button>
              </>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
