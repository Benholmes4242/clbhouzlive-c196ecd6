/**
 * Success Screen — Two variants: New Review (auto-shared) & Updated Review
 * Light theme #F8FAFC background with amber hero zone
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, Home, X, RotateCw, ArrowRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewWizardCourse, SuccessVariant } from './types';

interface SuccessScreenProps {
  variant: SuccessVariant;
  course: ReviewWizardCourse | null;
  ratingId: string;
  rating?: number | null;
  isEditMode?: boolean;
  previousRating?: number | null;
  postId?: string;
  isAutoSharing?: boolean;
  autoShareComplete?: boolean;
  onViewReview?: () => void;
  onViewPost?: () => void;
  onGoToClubhouse?: () => void;
  onDone: () => void;
  onOptOutShare?: () => void;
  onShareToClubhouse?: () => void;
  isSharing?: boolean;
}

/* ---------- Loading skeleton shown while auto-share is in flight ---------- */
function ShareLoadingSkeleton() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-5"
      style={{ background: '#F8FAFC' }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -800px 0; }
          100% { background-position: 800px 0; }
        }
        .skel {
          background: linear-gradient(90deg, #e9eef4 25%, #f1f5f9 50%, #e9eef4 75%);
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
          border-radius: 12px;
        }
      `}</style>
      <div className="skel" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 24 }} />
      <div className="skel" style={{ width: 120, height: 12, marginBottom: 10 }} />
      <div className="skel" style={{ width: 200, height: 20, marginBottom: 12 }} />
      <div className="skel" style={{ width: '80%', maxWidth: 300, height: 72, marginBottom: 24 }} />
      <div className="skel" style={{ width: '100%', maxWidth: 340, height: 52, marginBottom: 10 }} />
      <div className="skel" style={{ width: '100%', maxWidth: 340, height: 48 }} />
    </div>
  );
}

export function SuccessScreen({
  variant,
  course,
  ratingId,
  rating,
  isEditMode = false,
  previousRating,
  postId,
  isAutoSharing = false,
  autoShareComplete = false,
  onViewReview,
  onViewPost,
  onGoToClubhouse,
  onDone,
  onOptOutShare,
  onShareToClubhouse,
  isSharing = false,
}: SuccessScreenProps) {
  const tierData = rating ? getScoreTier(rating) : null;
  const [optedOut, setOptedOut] = useState(false);

  // Confetti on mount (after loading)
  useEffect(() => {
    if (isAutoSharing) return;
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F7931E', '#FBBC2E', '#ffffff', '#d97706'],
    });
  }, [isAutoSharing]);

  // Show loading skeleton while auto-sharing
  if (isAutoSharing) {
    return <ShareLoadingSkeleton />;
  }

  const courseName = course?.name || 'the course';
  const isNewReview = !isEditMode;

  const handleOptOut = () => {
    setOptedOut(true);
    onOptOutShare?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: '#F8FAFC' }}
    >
      {/* Amber gradient that extends into the notch/safe area */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 180px)',
          background: 'linear-gradient(180deg, rgba(247,147,30,0.07) 0%, rgba(248,250,252,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Safe area spacer */}
      <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', flexShrink: 0 }} />

      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute z-50 flex items-center justify-center transition-colors active:scale-[0.97]"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 10px)',
          left: 16,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.06)',
        }}
        aria-label="Close"
      >
        <X className="h-4 w-4" style={{ color: '#64748b' }} />
      </button>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto" style={{ padding: '0 20px' }}>
        {/* Hero zone */}
        <div
          className="relative flex items-center justify-center flex-shrink-0"
          style={{ width: '100%', height: 180 }}
        >
          <div className="absolute rounded-full" style={{ width: 160, height: 160, border: '1px solid rgba(247,147,30,0.10)' }} />
          <div className="absolute rounded-full" style={{ width: 120, height: 120, border: '1px solid rgba(247,147,30,0.14)' }} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative flex items-center justify-center rounded-full"
            style={{ width: 80, height: 80, background: 'rgba(247,147,30,0.12)', border: '1.5px solid rgba(247,147,30,0.28)' }}
          >
            {isEditMode ? (
              <RotateCw className="w-8 h-8" style={{ color: '#F7931E' }} strokeWidth={2.5} />
            ) : (
              <Check className="w-8 h-8" style={{ color: '#F7931E' }} strokeWidth={3} />
            )}
          </motion.div>
        </div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 8.5,
            fontWeight: 900,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#F7931E',
            marginBottom: 8,
          }}
        >
          {isEditMode ? 'RATING UPDATED' : 'COURSE RATED'}
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="success-headline"
          style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}
        >
          {isEditMode ? 'Verdict revised.' : 'Your take is live.'}
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 20, maxWidth: 280 }}
        >
          {isEditMode
            ? `Your updated take on ${courseName} is live`
            : `Your verdict on ${courseName} is live on clbhouz`}
        </motion.p>

        {/* Rating card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 }}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            width: '100%',
            maxWidth: 340,
          }}
        >
          {isEditMode && previousRating != null ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                  BEFORE
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#cbd5e1' }}>
                  {previousRating === 10 ? '10' : previousRating.toFixed(1)}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#F7931E' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                  NOW
                </span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                  {rating != null ? (rating === 10 ? '10' : rating.toFixed(1)) : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <Star className="w-4 h-4" style={{ color: '#F7931E', fill: '#F7931E', marginRight: 2, position: 'relative', top: 1 }} />
                <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                  {rating != null ? (rating === 10 ? '10' : rating.toFixed(1)) : '—'}
                </span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>/10</span>
                {tierData && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginLeft: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tierData.label}</span>
                )}
              </div>

              {isNewReview && !optedOut && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 10px' }}>
                  <Check className="w-3 h-3" style={{ color: '#16a34a' }} strokeWidth={3} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>Review saved</span>
                </div>
              )}

              {isNewReview && optedOut && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 10px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Not shared</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {isNewReview && !optedOut && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            style={{ fontSize: 11, color: '#cbd5e1', marginTop: 8 }}
          >
            Shared to your Clubhouse feed
          </motion.p>
        )}

        <div style={{ flex: 1, minHeight: 24 }} />
      </div>

      {/* Bottom buttons — pinned */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex-shrink-0 flex flex-col"
        style={{ padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)', gap: 8 }}
      >
        <button
          onClick={onViewReview}
          className="active:scale-[0.98] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', background: '#F7931E', borderRadius: 12, padding: 15,
            fontSize: 15, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 16px rgba(247,147,30,0.28)', border: 'none', cursor: 'pointer',
          }}
        >
          <Eye className="w-4 h-4" />
          View my review →
        </button>

        <button
          onClick={isEditMode ? onDone : onGoToClubhouse}
          className="active:scale-[0.98] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: 14, fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer',
          }}
        >
          <Home className="w-4 h-4" />
          {isEditMode ? 'Back to Clbhouz' : 'Go to Clbhouz'}
        </button>

        {isNewReview && !optedOut && onOptOutShare && (
          <button
            onClick={handleOptOut}
            style={{
              fontSize: 11, color: '#d1d5db', textDecoration: 'underline', textUnderlineOffset: '3px',
              cursor: 'pointer', textAlign: 'center', marginTop: 4,
              background: 'none', border: 'none', width: '100%',
            }}
          >
            Don't share to Clubhouse
          </button>
        )}
      </motion.div>

      <style>{`
        @media (max-width: 375px) {
          .success-headline { font-size: 24px !important; }
        }
      `}</style>
    </motion.div>
  );
}