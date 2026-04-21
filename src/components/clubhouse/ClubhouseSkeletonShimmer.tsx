/**
 * ClubhouseSkeletonShimmer — premium loading skeleton for Clubhouse.
 *
 * Matches the new TikTok-pattern layout:
 *   • Top strip: tabs centered + bare search/profile top-right (no glass pill)
 *   • Right vertical action rail: creator avatar + like/comment/share/more
 *   • Bottom-left content slot: course pill + author + caption (regular)
 *     OR amber-tinted InlineReviewCard skeleton (review)
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
  /** When true, the rail skeleton renders a mute placeholder at the top. */
  isVideo?: boolean;
}

const SkeletonBlock: React.FC<{
  className?: string;
  isStatic?: boolean;
  style?: React.CSSProperties;
}> = ({ className, isStatic = false, style }) => (
  <div
    className={cn('relative overflow-hidden bg-white/[0.06]', !isStatic && 'clb-shimmer-dark', className)}
    style={style}
  />
);

const MediaAreaSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div className="absolute inset-0">
    <SkeletonBlock isStatic={isStatic} className="w-full h-full rounded-none" />
  </div>
);

/** Right-side vertical action rail skeleton — mirrors FeedActionRail shape. */
const ActionRailSkeleton: React.FC<{ isStatic?: boolean; isVideo?: boolean }> = ({ isStatic, isVideo }) => (
  <div
    className="absolute flex flex-col items-center"
    style={{
      right: 12,
      bottom: 'calc(var(--bottom-nav-height, 88px) + 24px)',
      gap: 18,
    }}
  >
    {/* Mute placeholder — only for video posts (matches real rail) */}
    {isVideo && (
      <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 28, height: 28 }} />
    )}
    {/* Creator avatar 48px squircle (matches SquircleAvatar) + follow plus circle */}
    <div className="relative">
      <SkeletonBlock
        isStatic={isStatic}
        style={{ width: 48, height: 48, borderRadius: '34%' }}
      />
      <SkeletonBlock
        isStatic={isStatic}
        className="rounded-full"
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 20,
          height: 20,
          background: 'rgba(247,147,30,0.35)',
        }}
      />
    </div>
    {/* Like + count */}
    <div className="flex flex-col items-center" style={{ gap: 4 }}>
      <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 32, height: 32 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 22, height: 10 }} />
    </div>
    {/* Comment + count */}
    <div className="flex flex-col items-center" style={{ gap: 4 }}>
      <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 32, height: 32 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 18, height: 10 }} />
    </div>
    {/* Share */}
    <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 30, height: 30 }} />
    {/* More */}
    <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 30, height: 30 }} />
  </div>
);

const RegularBottomSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div
    className="absolute flex flex-col"
    style={{
      bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
      left: 16,
      right: 80, // reserve space for action rail
      gap: 8,
    }}
  >
    {/* Course tag pill */}
    <SkeletonBlock isStatic={isStatic} className="rounded-full" style={{ width: 130, height: 22 }} />

    {/* Author row */}
    <div className="flex items-center gap-2.5">
      <SkeletonBlock isStatic={isStatic} className="rounded-full shrink-0" style={{ width: 32, height: 32 }} />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 100, height: 12 }} />
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 44, height: 9 }} />
        </div>
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 170, height: 10 }} />
      </div>
    </div>

    {/* Caption — 2 lines */}
    <div className="flex flex-col gap-1.5" style={{ marginTop: 2 }}>
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '92%', height: 11 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '60%', height: 11 }} />
    </div>
  </div>
);

const ReviewBottomSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div
    className="absolute"
    style={{
      left: 16,
      right: 80, // reserve space for action rail
      bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
      background: 'rgba(20, 13, 4, 0.92)',
      border: '0.5px solid rgba(245, 158, 11, 0.18)',
      borderRadius: 16,
      overflow: 'hidden',
    }}
  >
    {/* Amber accent bar */}
    <div style={{ height: 2, background: 'linear-gradient(90deg, rgba(247,147,30,0.85), transparent)' }} />
    <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
      {/* Rating top-right */}
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
);

export const ClubhouseSkeletonShimmer: React.FC<ClubhouseSkeletonShimmerProps> = ({
  isVisible,
  isStatic = false,
  className,
  variant = 'regular',
  isVideo = false,
}) => {
  const reduceMotion = prefersReducedMotion();
  const effectiveStatic = isStatic || reduceMotion;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('absolute inset-0 z-50 pointer-events-none', 'bg-[#0F0F0F]', className)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="relative w-full h-full">
            {/* Hero media area */}
            <MediaAreaSkeleton isStatic={effectiveStatic} />

            {/* ─── TOP STRIP — centred cluster: tabs · divider · search · profile ─── */}
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 6px)',
                padding: '0 16px',
                height: 44,
              }}
            >
              <div className="flex items-center" style={{ gap: 16 }}>
                {/* Tab 1 placeholder */}
                <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 70, height: 16 }} />
                {/* Tab 2 placeholder */}
                <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 84, height: 16 }} />
                {/* Divider */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 18,
                    background: 'rgba(255,255,255,0.1)',
                    margin: '0 2px',
                  }}
                />
                {/* Search icon placeholder */}
                <SkeletonBlock isStatic={effectiveStatic} className="rounded-sm" style={{ width: 20, height: 20 }} />
                {/* Profile avatar placeholder */}
                <SkeletonBlock isStatic={effectiveStatic} className="rounded-full" style={{ width: 30, height: 30 }} />
              </div>
            </div>

            {/* ─── RIGHT ACTION RAIL ─── */}
            <ActionRailSkeleton isStatic={effectiveStatic} isVideo={isVideo} />

            {/* ─── BOTTOM CONTENT ─── */}
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
