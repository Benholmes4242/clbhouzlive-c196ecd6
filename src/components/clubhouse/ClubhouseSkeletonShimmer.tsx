/**
 * ClubhouseSkeletonShimmer - Premium loading skeleton for Clubhouse
 * 
 * Matches the current Clubhouse layout:
 * - Same dark background
 * - Top tabs row (centred, no background)
 * - Top-right bare icons (search + profile)
 * - Bottom bar with author row, caption, horizontal action strip
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

export const ClubhouseSkeletonShimmer: React.FC<ClubhouseSkeletonShimmerProps> = ({
  isVisible,
  isStatic = false,
  className,
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
            {/* Row 1: Tabs (centred, no background) — mimics "Suggested · Friends" */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
                gap: 28,
                height: 44,
              }}
            >
              <SkeletonBlock
                isStatic={effectiveStatic}
                className="rounded-sm"
                style={{ width: 70, height: 14 }}
              />
              <SkeletonBlock
                isStatic={effectiveStatic}
                className="rounded-sm"
                style={{ width: 54, height: 14 }}
              />
            </div>

            {/* Row 2: Top-right bare icons — search + profile avatar */}
            <div
              className="absolute flex items-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
                right: 14,
                gap: 6,
                height: 44,
              }}
            >
              <SkeletonBlock
                isStatic={effectiveStatic}
                className="rounded-sm"
                style={{ width: 22, height: 22 }}
              />
              <SkeletonBlock
                isStatic={effectiveStatic}
                className="rounded-full"
                style={{ width: 32, height: 32 }}
              />
            </div>

            {/* ─── BOTTOM CHROME ─── */}
            {/* Gradient scrim — matches BreathingRoomBottomBar */}
            <div
              className="absolute inset-x-0 pointer-events-none"
              style={{
                bottom: 'var(--bottom-nav-height, 88px)',
                height: 240,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.92) 55%)',
              }}
            />

            {/* Bottom bar content */}
            <div
              className="absolute inset-x-0 flex flex-col gap-3"
              style={{
                bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              {/* Author row: avatar + name + HCP + sub-line */}
              <div className="flex items-center gap-2.5">
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full shrink-0"
                  style={{ width: 34, height: 34 }}
                />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <SkeletonBlock
                      isStatic={effectiveStatic}
                      className="rounded-sm"
                      style={{ width: 100, height: 12 }}
                    />
                    <SkeletonBlock
                      isStatic={effectiveStatic}
                      className="rounded-sm"
                      style={{ width: 44, height: 9 }}
                    />
                  </div>
                  <SkeletonBlock
                    isStatic={effectiveStatic}
                    className="rounded-sm"
                    style={{ width: 170, height: 10 }}
                  />
                </div>
              </div>

              {/* Caption lines (2 lines) */}
              <div className="flex flex-col gap-1.5">
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-sm"
                  style={{ width: '88%', height: 11 }}
                />
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-sm"
                  style={{ width: '62%', height: 11 }}
                />
              </div>

              {/* Horizontal action strip: like · comment · share · FOLLOW · more */}
              <div
                className="flex items-center"
                style={{
                  gap: 22,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full"
                  style={{ width: 28, height: 28 }}
                />
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full"
                  style={{ width: 28, height: 28 }}
                />
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full"
                  style={{ width: 28, height: 28 }}
                />
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full"
                  style={{ width: 98, height: 32 }}
                />
                <div style={{ flex: 1 }} />
                <SkeletonBlock
                  isStatic={effectiveStatic}
                  className="rounded-full"
                  style={{ width: 28, height: 28 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClubhouseSkeletonShimmer;
