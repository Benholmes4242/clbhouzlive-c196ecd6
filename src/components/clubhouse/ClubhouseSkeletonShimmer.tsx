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
import { prefersReducedMotion } from '@/utils/env';
import { useSkeletonShownWhenVisible } from '@/perf/usePageReady';
import PostRoundShell from '@/components/feed/PostRoundShell';
import { COLD_START_SHAPE, type SkeletonCardVariant } from '@/lib/clubhouse/skeletonShapeHint';

interface ClubhouseSkeletonShimmerProps {
  isVisible: boolean;
  isStatic?: boolean; // Fallback mode after max timeout
  className?: string;
  /** Which post shape to skeleton. Defaults to 'regular'. */
  variant?: SkeletonCardVariant;
  /** CSS aspect-ratio for the media block (media variants only). */
  mediaRatio?: string;
  /** When true, the rail skeleton renders a mute placeholder at the top. */
  isVideo?: boolean;
  /** 'card' = inline feed card stack; 'fullscreen' = immersive overlay (default). */
  surface?: 'card' | 'fullscreen';
}

const SkeletonBlock: React.FC<{
  className?: string;
  isStatic?: boolean;
  style?: React.CSSProperties;
}> = ({ className, isStatic = false, style }) => (
  <div
    className={cn('relative overflow-hidden', !isStatic && 'clb-shimmer-dark', className)}
    style={{ background: 'rgba(255,255,255,0.06)', ...style }}
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

/**
 * Editorial Frost Panel review skeleton — mirrors PR 7's `InlineReviewCard`.
 * Uses the same glass background, 2×2 breakdown grid placeholder, italic-excerpt
 * placeholder, compact author row, and amber "READ FULL REVIEW" band so the
 * structural transition to the real tile is seamless.
 */
const ReviewBottomSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div
    className="absolute"
    style={{
      left: 16,
      right: 80, // reserve space for action rail
      bottom: 'calc(var(--bottom-nav-height, 88px) + 20px)',
      background: 'rgba(15, 20, 30, 0.42)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
    }}
  >
    {/* Decorative amber glow orb (matches real tile) */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: -40,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(247,147,30,0.35), transparent 65%)',
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }}
    />

    <div style={{ padding: '16px 16px 0', position: 'relative' }}>
      {/* Title row — title (1 line) + score on right */}
      <div className="flex items-end justify-between" style={{ gap: 12 }}>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '70%', height: 16 }} />
        </div>
        <div className="flex items-baseline shrink-0" style={{ gap: 3 }}>
          <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 46, height: 32 }} />
          <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 18, height: 9 }} />
        </div>
      </div>

      {/* Location placeholder */}
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 110, height: 9, marginTop: 8 }} />

      {/* 2×2 breakdown grid placeholder — mirrors PR 7 tile */}
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 18,
          rowGap: 10,
          paddingTop: 12,
          paddingBottom: 14,
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          marginBottom: 12,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-baseline justify-between" style={{ gap: 6 }}>
            <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 64, height: 8 }} />
            <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 22, height: 11 }} />
          </div>
        ))}
      </div>

      {/* Excerpt — 2 lines */}
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '94%', height: 10, marginBottom: 4 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '64%', height: 10, marginBottom: 12 }} />

      {/* Author row — small avatar + name + ·N rated · date */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 12 }}>
        <SkeletonBlock isStatic={isStatic} className="rounded-full shrink-0" style={{ width: 22, height: 22 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 90, height: 10, marginLeft: 2 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 50, height: 9 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 40, height: 9 }} />
      </div>
    </div>

    {/* "READ FULL REVIEW →" amber band placeholder (edge-to-edge) */}
    <div
      style={{
        padding: '10px 16px',
        background: 'rgba(247, 147, 30, 0.08)',
        borderTop: '1px solid rgba(247, 147, 30, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <SkeletonBlock
        isStatic={isStatic}
        className="rounded-sm"
        style={{ width: 110, height: 9, background: 'rgba(252, 217, 157, 0.20)' }}
      />
      <SkeletonBlock
        isStatic={isStatic}
        className="rounded-sm"
        style={{ width: 12, height: 12, background: 'rgba(252, 217, 157, 0.20)' }}
      />
    </div>
  </div>
);

const CARD_BG = '#10151C';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const CANVAS = '#05070A';

export const CardSkeleton: React.FC<{
  isStatic?: boolean;
  variant?: 'regular' | 'review';
  mediaRatio?: string;
}> = ({ isStatic = false, variant = 'regular', mediaRatio = '4/5' }) => (
  <div style={{ background: CARD_BG, overflow: 'hidden', marginInline: 0 }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
      <SkeletonBlock
        isStatic={isStatic}
        style={{ width: 34, height: 34, borderRadius: '34%', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 120, height: 13 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 80, height: 10 }} />
      </div>
      {/* Optional pill */}
      {variant === 'review' && (
        <SkeletonBlock
          isStatic={isStatic}
          className="rounded-full"
          style={{ width: 90, height: 24, flexShrink: 0 }}
        />
      )}
    </div>

    {/* Media */}
    <div style={{ position: 'relative', width: '100%', aspectRatio: mediaRatio, overflow: 'hidden' }}>
      <SkeletonBlock isStatic={isStatic} className="w-full h-full rounded-none" />
    </div>

    {/* Caption */}
    <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '70%', height: 16 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: '40%', height: 12 }} />
    </div>

    {/* Footer */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 12px',
        borderTop: `1px solid ${HAIRLINE}`,
      }}
    >
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 90, height: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
      </div>
    </div>
  </div>
);

/**
 * Round-post skeleton — mirrors PostRoundCard's block order and heights.
 *
 * The scorecard block is PostRoundShell ITSELF, not a re-measurement of it:
 * that file already tracks PostRoundCard's element tree, paddings, font sizes
 * and trajectory viewBox, so its height tracks the real card at every width. A
 * second, hand-estimated copy of those heights is exactly the defect this
 * section fixes.
 */
const RoundCardSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic = false }) => (
  <div style={{ background: CARD_BG, overflow: 'hidden', marginInline: 0 }}>
    {/* Header — identical to CardSkeleton's */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
      <SkeletonBlock
        isStatic={isStatic}
        style={{ width: 34, height: 34, borderRadius: '34%', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 120, height: 13 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 80, height: 10 }} />
      </div>
    </div>

    {/* Date / course / region / par-slope / trajectory / OUT / IN — real geometry. */}
    <PostRoundShell />

    {/* Course band row — PostRoundCard's band: 10px pad, 12.5px line. */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 14px',
        borderTop: `1px solid ${HAIRLINE}`,
      }}
    >
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 140, height: 13 }} />
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 34, height: 12 }} />
    </div>

    {/* Action row — identical to CardSkeleton's footer */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 12px',
        borderTop: `1px solid ${HAIRLINE}`,
      }}
    >
      <SkeletonBlock isStatic={isStatic} className="rounded-sm" style={{ width: 90, height: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
        <SkeletonBlock isStatic={isStatic} className="rounded-md" style={{ width: 20, height: 20 }} />
      </div>
    </div>
  </div>
);

const CardFeedSkeleton: React.FC<{
  isStatic?: boolean;
  variant?: SkeletonCardVariant;
  mediaRatio?: string;
}> = ({ isStatic = false, variant = 'regular', mediaRatio }) => {
  const topPad = 'calc(env(safe-area-inset-top, 0px) + 70px)';
  const Card: React.FC<{ isStatic?: boolean }> = ({ isStatic: st }) =>
    variant === 'round' ? (
      <RoundCardSkeleton isStatic={st} />
    ) : (
      <CardSkeleton isStatic={st} variant={variant} mediaRatio={mediaRatio ?? COLD_START_SHAPE.mediaRatio} />
    );
  // No chrome placeholder here: the REAL ChromeIsland is mounted unconditionally
  // by GlobalHeader and already renders its own smallest settled state (logo
  // capsule + search glyph + 34px avatar placeholder). Any capsule drawn here
  // paints behind it (zIndex 40 vs Z.header 1000) and can only be wider than
  // what it resolves into. topPad still reserves the real island's HEADER_H.
  return (
    /* ONE full card plus a second clipped by the viewport. Anything further
       down is shimmer nobody sees whose only effect is a bigger upward
       collapse when real content lands. `overflow: hidden` (not auto) is what
       keeps the second card clipped rather than scrollable. */
    <div
      style={{
        background: CANVAS,
        minHeight: '100dvh',
        maxHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        paddingTop: topPad,
        paddingBottom: 'calc(var(--bottom-nav-height, 88px) + 12px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Card isStatic={isStatic} />
        <Card isStatic={isStatic} />
      </div>
    </div>
  );
};

export const ClubhouseSkeletonShimmer: React.FC<ClubhouseSkeletonShimmerProps> = ({
  isVisible,
  isStatic = false,
  className,
  variant = 'regular',
  mediaRatio,
  isVideo = false,
  surface = 'fullscreen',
}) => {
  const reduceMotion = prefersReducedMotion();
  const effectiveStatic = isStatic || reduceMotion;
  useSkeletonShownWhenVisible(isVisible);


  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('absolute inset-0 z-50 pointer-events-none', 'bg-[#05070A]', className)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {surface === 'card' ? (
            <CardFeedSkeleton isStatic={effectiveStatic} variant={variant} mediaRatio={mediaRatio} />
          ) : (
            <div className="relative w-full h-full">
              {/* Hero media area */}
              <MediaAreaSkeleton isStatic={effectiveStatic} />

              {/* ─── TOP STRIP — centred cluster: tabs · divider · search · profile ─── */}
              <div
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{
                  top: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 6px)',
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
              {variant !== 'review' ? (
                <RegularBottomSkeleton isStatic={effectiveStatic} />
              ) : (
                <ReviewBottomSkeleton isStatic={effectiveStatic} />
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClubhouseSkeletonShimmer;
