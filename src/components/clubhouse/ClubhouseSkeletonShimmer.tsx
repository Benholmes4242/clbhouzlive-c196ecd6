/**
 * ClubhouseSkeletonShimmer - Premium loading skeleton for Clubhouse
 * 
 * Matches the current Clubhouse layout:
 * - Same dark background
 * - Top tabs row (centred, no background)
 * - Top-right bare icons (search + profile)
 * - Bottom bar with author row, caption, horizontal action strip (regular)
 *   OR amber-tinted review card with reviewer row + excerpt (review)
 * - Subtle dark-on-dark shimmer animation
 * 
 * Shows until first video frame is ready, then fades out smoothly.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/utils/safePlay';

interface ClubhouseSkeletonShimmerProps {
  isVisible: boolean;
  isStatic?: boolean; // Fallback mode after max timeout
  className?: string;
  /** Which post shape to skeleton. Defaults to 'regular'. */
  variant?: 'regular' | 'review';
}

/**
 * Skeleton block with shimmer animation using standardized tailwind keyframe
 */
const SkeletonBlock: React.FC<{
  className?: string;
  isStatic?: boolean;
  style?: React.CSSProperties;
}> = ({ className, isStatic = false, style }) => (
  <div 
    className={cn(
      "relative overflow-hidden bg-white/[0.06]",
      !isStatic && "clb-shimmer-dark",
      className
    )}
    style={style}
  />
);

/**
 * Main hero media area skeleton
 */
const MediaAreaSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div className="absolute inset-0">
    <SkeletonBlock 
      isStatic={isStatic}
      className="w-full h-full rounded-none"
    />
  </div>
);

const RegularBottomSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <>
    {/* Gradient scrim — matches BreathingRoomBottomBar regular mode */}
    <div
      className="absolute inset-x-0 pointer-events-none"
      style={{
        bottom: 'var(--bottom-nav-height, 88px)',
        height: 240,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.92) 55%)',
      }}
    />

    <div
      className="absolute inset-x-0 flex flex-col gap-3"
      style={{
        bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5">
        <SkeletonBlock isStatic={isStatic} className="rounded-full shrink-0" style={{ width: 34, height: 34 }} />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 100, height: 12 }} />
            <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 44, height: 9 }} />
          </div>
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 170, height: 10 }} />
        </div>
      </div>

      {/* Caption (2 lines) */}
      <div className="flex flex-col gap-1.5">
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '88%', height: 11 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '62%', height: 11 }} />
      </div>

      {/* Action strip */}
      <div
        className="flex items-center"
        style={{
          gap: 22,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 98, height: 32 }} />
        <div style={{ flex: 1 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
      </div>
    </div>
  </>
);

const ReviewBottomSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <>
    {/* No gradient on review variant */}
    {/* InlineReviewCard skeleton — mimics the amber-tinted dark card */}
    <div
      className="absolute"
      style={{
        left: 12,
        right: 12,
        bottom: 'calc(var(--bottom-nav-height, 88px) + 72px)',
        background: 'rgba(20, 13, 4, 0.92)',
        border: '0.5px solid rgba(245, 158, 11, 0.18)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Amber accent bar */}
      <div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, rgba(247,147,30,0.85), transparent)',
        }}
      />
      <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
        {/* Rating — absolute top-right */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
          }}
        >
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 34, height: 22 }} />
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 18, height: 10 }} />
        </div>

        {/* Course name */}
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '60%', height: 18, marginBottom: 6 }} />

        {/* Location row */}
        <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 12, height: 12 }} />
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 120, height: 10 }} />
        </div>

        {/* Amber-fade divider */}
        <div
          style={{
            height: 0.5,
            marginBottom: 10,
            background: 'linear-gradient(90deg, rgba(247,147,30,0.3) 0%, transparent 75%)',
          }}
        />

        {/* Reviewer row */}
        <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
          <SkeletonBlock isStatic={isStatic} className="rounded-lg shrink-0" style={{ width: 32, height: 32 }} />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 85, height: 11 }} />
              <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 76, height: 14 }} />
            </div>
            <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 110, height: 9 }} />
          </div>
        </div>

        {/* Excerpt — 2 lines */}
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '92%', height: 11, marginBottom: 4 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '58%', height: 11 }} />
      </div>
    </div>

    {/* Action strip — same as regular */}
    <div
      className="absolute inset-x-0 flex items-center"
      style={{
        bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
        paddingLeft: 16,
        paddingRight: 16,
        gap: 22,
      }}
    >
      <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 98, height: 32 }} />
      <div style={{ flex: 1 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 28, height: 28 }} />
    </div>
  </>
);

export const ClubhouseSkeletonShimmer: React.FC<ClubhouseSkeletonShimmerProps> = ({
  isVisible,
  isStatic = false,
  className,
  variant = 'regular',
}) => {
  // Respect reduced motion: use static skeleton (no shimmer) when preferred
  const reduceMotion = prefersReducedMotion();
  const effectiveStatic = isStatic || reduceMotion;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute inset-0 z-50 pointer-events-none",
            "bg-[#0F0F0F]",
            className
          )}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="relative w-full h-full">
            {/* Hero media area — fills viewport */}
            <MediaAreaSkeleton isStatic={effectiveStatic} />

            {/* ─── TOP CHROME ─── */}
            {/* Row 1: Tabs (centred, no background) */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
                gap: 28,
                height: 44,
              }}
            >
              <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 70, height: 14 }} />
              <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 54, height: 14 }} />
            </div>

            {/* Row 2: Top-right bare icons */}
            <div
              className="absolute flex items-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
                right: 14,
                gap: 6,
                height: 44,
              }}
            >
              <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 22, height: 22 }} />
              <SkeletonBlock isStatic={effectiveStatic} className="rounded-full" style={{ width: 32, height: 32 }} />
            </div>

            {/* ─── BOTTOM CHROME ─── */}
            {variant === 'regular' ? (
              <RegularBottomSkeleton isStatic={effectiveStatic} />
            ) : (
              <ReviewBottomSkeleton isStatic={effectiveStatic} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClubhouseSkeletonShimmer;
