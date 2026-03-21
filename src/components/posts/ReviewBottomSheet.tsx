import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, MapPin } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const AMBER = '#f59e0b';

function getTierLabel(rating: number): string {
  if (rating >= 9.0) return 'Outstanding';
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.0) return 'Very Good';
  if (rating >= 6.5) return 'Good';
  return 'Fair';
}

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
    onClose();
    navigate(`/courses/${courseId}`);
  }, [courseId, navigate, onClose]);

  const handleGoToReview = useCallback(() => {
    onClose();
    const url = reviewId
      ? `/courses/${courseId}?tab=reviews&review=${reviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  }, [courseId, reviewId, navigate, onClose]);

  const tierLabel = getTierLabel(rating);

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
              background: '#0d0d0d',
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
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

            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: AMBER,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                REVIEW
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <X size={18} color="rgba(255,255,255,0.5)" />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 20px 0' }}>
              {/* Creator row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <SquircleAvatar
                  size={40}
                  src={user.avatar}
                  alt={user.name}
                  fallback={initials}
                  hideRing
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    reviewed this course
                  </div>
                </div>
              </div>

              {/* Course card */}
              <div style={{
                background: `${AMBER}06`,
                border: `1px solid ${AMBER}22`,
                borderRadius: 16,
                padding: '14px 16px',
                marginBottom: reviewText ? 16 : 16,
              }}>
                {/* Tier eyebrow */}
                <div style={{
                  fontSize: 10, fontWeight: 800, color: AMBER,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  {tierLabel}
                </div>

                {/* Course name + rating pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, marginBottom: locationStr ? 8 : 0,
                }}>
                  <div style={{
                    fontSize: 17, fontWeight: 700, color: '#fff',
                    flex: 1, minWidth: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {courseName}
                  </div>

                  {/* Rating pill */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(245,158,11,0.12)',
                    border: `0.5px solid ${AMBER}55`,
                    borderRadius: 10,
                    padding: '5px 10px',
                    flexShrink: 0,
                  }}>
                    <Star size={11} fill={AMBER} color={AMBER} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: AMBER }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Location */}
                {locationStr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} color="rgba(255,255,255,0.35)" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {locationStr}
                    </span>
                  </div>
                )}
              </div>

              {/* Review text */}
              {reviewText && (
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  borderLeft: `2px solid ${AMBER}44`,
                  paddingLeft: 14,
                  marginBottom: 16,
                }}>
                  {reviewText}
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div style={{
              display: 'flex', gap: 12,
              padding: '14px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
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
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.65), rgba(190,118,5,0.52))',
                  border: `1px solid ${AMBER}44`,
                  borderRadius: 14,
                  padding: '13px 16px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.18)',
                }}
              >
                Go to Review
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
