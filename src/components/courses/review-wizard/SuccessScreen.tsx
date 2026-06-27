/**
 * Success Screen — "Delight" redesign.
 *
 * New-review path: floating score chip with breathing glow, score-adaptive
 * headline, and rating treatment pulled from the canonical @/lib/ratingTier
 * tokens so the language matches the Clubhouse review cards exactly
 * (grey → amber → animated gold shimmer).
 *
 * Edit-mode path keeps the before/after card, but reuses the same headline
 * map so wording is consistent across both flows.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, Home, X, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getRatingTier,
  getRatingTierLabel,
  ratingTextColor,
  HERO_NUMBER_STYLE,
} from '@/lib/ratingTier';
import type { ReviewWizardCourse, SuccessVariant } from './types';

interface SuccessScreenProps {
  variant: SuccessVariant;
  course: ReviewWizardCourse | null;
  ratingId: string;
  rating?: number | null;
  isEditMode?: boolean;
  previousRating?: number | null;
  postId?: string;
  onViewReview?: () => void;
  onDone: () => void;
}

function successHeadline(rating: number | null | undefined): string {
  if (rating == null) return 'Your verdict is live';
  const tier = getRatingTier(rating);
  switch (tier) {
    case 'EXCEPTIONAL': return 'Top marks';
    case 'EXCELLENT':   return 'High praise';
    case 'GOOD':        return 'A solid verdict';
    case 'FAIR':        return 'A fair shout';
    case 'POOR':        return 'An honest call';
    default:            return 'Your verdict is live';
  }
}

const fmtScore = (r: number) => (r === 10 ? '10' : r.toFixed(1));

export function SuccessScreen({
  course,
  rating,
  isEditMode = false,
  previousRating,
  onViewReview,
  onDone,
}: SuccessScreenProps) {
  const courseName = course?.name || 'the course';
  const isNewReview = !isEditMode;

  const tier = getRatingTier(rating);
  const isExceptional = tier === 'EXCEPTIONAL';
  const ratingColor = ratingTextColor(rating);
  const tierLabel = rating != null ? getRatingTierLabel(rating) : null;

  // Confetti — tinted gold for Exceptional, otherwise amber/white.
  useEffect(() => {
    confetti({
      particleCount: isExceptional ? 90 : 60,
      spread: isExceptional ? 75 : 60,
      origin: { y: 0.6 },
      colors: isExceptional
        ? ['#FFC23D', '#F0A500', '#FFE08A', '#ffffff']
        : ['#F7931E', '#FBBC2E', '#ffffff', '#d97706'],
    });
  }, [isExceptional]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'linear-gradient(180deg, #fffaf3 0%, #F8FAFC 40%)' }}
    >
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
        {/* Hero zone — chip + breathing glow */}
        <div
          className="relative flex items-center justify-center flex-shrink-0"
          style={{ width: '100%', height: 210, marginTop: 12 }}
        >
          {/* Breathing glow behind the chip */}
          <div
            className="success-glow"
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 280,
              height: 280,
              marginTop: -140,
              transform: 'translateX(-50%)',
              background: isExceptional
                ? 'radial-gradient(circle, rgba(255,184,0,0.20), transparent 60%)'
                : 'radial-gradient(circle, rgba(247,147,30,0.16), transparent 60%)',
              filter: 'blur(20px)',
              animation: 'successGlowBreathe 3.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {isEditMode ? (
            // Edit mode — keep the before/after card style inside a simple chip frame
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
              className="success-chip relative"
              style={{
                background: '#fff',
                borderRadius: 24,
                padding: '18px 22px',
                boxShadow: isExceptional
                  ? '0 20px 50px -16px rgba(255,184,0,0.45), 0 4px 12px rgba(15,23,42,0.06)'
                  : '0 20px 50px -16px rgba(247,147,30,0.4), 0 4px 12px rgba(15,23,42,0.06)',
                animation: 'successChipFloat 4.2s ease-in-out infinite',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                    Before
                  </span>
                  <span style={{ fontSize: 28, color: '#cbd5e1', ...HERO_NUMBER_STYLE }}>
                    {previousRating != null ? fmtScore(previousRating) : '—'}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: ratingColor }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                    Now
                  </span>
                  <span
                    className={isExceptional ? 'clbhouz-gold-shimmer' : undefined}
                    style={{ fontSize: 36, color: ratingColor, ...HERO_NUMBER_STYLE }}
                  >
                    {rating != null ? fmtScore(rating) : '—'}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 210, damping: 16, delay: 0.15 }}
              className="success-chip relative flex flex-col items-center justify-center"
              style={{
                width: 130,
                height: 130,
                background: '#fff',
                borderRadius: 40,
                boxShadow: isExceptional
                  ? '0 20px 50px -16px rgba(255,184,0,0.45), 0 4px 12px rgba(15,23,42,0.06)'
                  : '0 20px 50px -16px rgba(247,147,30,0.4), 0 4px 12px rgba(15,23,42,0.06)',
                animation: 'successChipFloat 4.2s ease-in-out infinite',
              }}
            >
              {rating != null ? (
                <>
                  <span
                    className={isExceptional ? 'clbhouz-gold-shimmer' : undefined}
                    style={{
                      fontSize: 50,
                      color: ratingColor,
                      lineHeight: 1,
                      ...HERO_NUMBER_STYLE,
                    }}
                  >
                    {fmtScore(rating)}
                  </span>
                  {tierLabel && (
                    <span
                      className={isExceptional ? 'clbhouz-gold-shimmer' : undefined}
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: ratingColor,
                      }}
                    >
                      {tierLabel}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 50, color: '#94a3b8', ...HERO_NUMBER_STYLE }}>—</span>
              )}

              {/* Check badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.6 }}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isExceptional ? '#F0A500' : '#F7931E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(15,23,42,0.18)',
                  border: '2px solid #fff',
                }}
              >
                <Check className="w-4 h-4" style={{ color: '#fff' }} strokeWidth={3.5} />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="success-headline"
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            margin: 0,
            marginTop: 18,
            textAlign: 'center',
          }}
        >
          {successHeadline(rating)}
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: 14,
            color: '#64748B',
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 20,
            maxWidth: 270,
            lineHeight: 1.4,
          }}
        >
          Your verdict on {courseName} is live in the feed.
        </motion.p>

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
          onClick={onDone}
          className="active:scale-[0.98] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: 14, fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer',
          }}
        >
          <Home className="w-4 h-4" />
          Done
        </button>
      </motion.div>

      <style>{`
        @keyframes successGlowBreathe {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1;   transform: translateX(-50%) scale(1.12); }
        }
        @keyframes successChipFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .success-glow, .success-chip { animation: none !important; }
        }
        @media (max-width: 375px) {
          .success-headline { font-size: 24px !important; }
        }
      `}</style>
    </motion.div>
  );
}
