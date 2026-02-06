/**
 * ClubhouseSkeletonShimmer - Premium loading skeleton for Clubhouse
 * 
 * Matches the Clubhouse layout exactly:
 * - Same dark background
 * - Right-side action rail placeholders
 * - Bottom-left caption block placeholder
 * - Subtle dark-on-dark shimmer animation
 * 
 * Shows until first video frame is ready, then fades out smoothly.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
      className
    )}
    style={style}
  >
    {!isStatic && (
      <div 
        className="absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
      />
    )}
  </div>
);

// Match CinematicActionRail layout constants exactly
const SLOT_HEIGHT = 64; // icon (44px) + gap (4px) + count container (16px)
const ICON_SIZE = 44;
const COUNT_HEIGHT = 16;
const GAP = 12;
const SLOT_COUNT = 5; // Mute, Like, Comment, Share, Save
const TOTAL_RAIL_HEIGHT = SLOT_COUNT * SLOT_HEIGHT + (SLOT_COUNT - 1) * GAP;

/**
 * Action rail skeleton - matches CinematicActionRail layout exactly
 * Uses same fixed slot heights and positioning as the real component
 */
const ActionRailSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => {
  // Match real rail: Mute (no count), Like (count), Comment (count), Share (no count), Save (no count)
  const slots = [
    { hasCount: false }, // Mute
    { hasCount: true },  // Like
    { hasCount: true },  // Comment
    { hasCount: false }, // Share
    { hasCount: false }, // Save
  ];

  return (
    <div 
      className="flex flex-col items-center"
      style={{ gap: GAP, height: TOTAL_RAIL_HEIGHT }}
    >
      {slots.map((slot, i) => (
        <div 
          key={i} 
          className="flex flex-col items-center"
          style={{ height: SLOT_HEIGHT }}
        >
          {/* Icon circle - fixed 44px */}
          <SkeletonBlock 
            isStatic={isStatic}
            className="rounded-full"
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
          />
          {/* Count container - ALWAYS in layout (matches real component) */}
          <div 
            className="flex items-center justify-center"
            style={{ height: COUNT_HEIGHT, marginTop: 4 }}
          >
            {slot.hasCount && (
              <SkeletonBlock 
                isStatic={isStatic}
                className="rounded-sm"
                style={{ width: 20, height: 10 }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Creator capsule skeleton - matches CreatorCapsule layout exactly
 * Same positioning, sizing, and visual treatment
 */
const CreatorCapsuleSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div 
    className="flex flex-col gap-2.5 p-3 rounded-sq-lg bg-black/50 backdrop-blur-2xl border border-white/10"
    style={{ maxWidth: '75vw', minWidth: 200 }}
  >
    {/* Top row: avatar + username (matches collapsed state) */}
    <div className="flex items-center gap-3">
      <SkeletonBlock 
        isStatic={isStatic}
        className="rounded-sq-md shrink-0"
        style={{ width: 36, height: 36 }}
      />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <SkeletonBlock 
          isStatic={isStatic}
          className="rounded-sm"
          style={{ width: 90, height: 12 }}
        />
        <SkeletonBlock 
          isStatic={isStatic}
          className="rounded-sm"
          style={{ width: 130, height: 10 }}
        />
      </div>
    </div>
    
    {/* Caption line placeholder */}
    <SkeletonBlock 
      isStatic={isStatic}
      className="rounded-sm"
      style={{ width: '85%', height: 10 }}
    />
  </div>
);

/**
 * Main hero media area skeleton
 */
const MediaAreaSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div className="absolute inset-0">
    <SkeletonBlock 
      isStatic={isStatic}
      className="w-full h-full rounded-2xl"
    />
  </div>
);

export const ClubhouseSkeletonShimmer: React.FC<ClubhouseSkeletonShimmerProps> = ({
  isVisible,
  isStatic = false,
  className,
}) => {
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
          {/* Full screen container matching Clubhouse layout */}
          <div className="relative w-full h-full">
            
            {/* Hero media area skeleton - fills the viewport */}
            <MediaAreaSkeleton isStatic={isStatic} />
            
            {/* Right-side action rail - positioned exactly like CinematicActionRail */}
            <div 
              className="absolute right-4 flex flex-col items-center"
              style={{ 
                bottom: 'calc(30px + 80px)',
              }}
            >
              <ActionRailSkeleton isStatic={isStatic} />
            </div>
            
            {/* Bottom-left creator capsule - positioned exactly like CreatorCapsule */}
            <div 
              className="absolute left-4"
              style={{ 
                bottom: 'calc(30px + 80px)',
              }}
            >
              <CreatorCapsuleSkeleton isStatic={isStatic} />
            </div>
            
            {/* Subtle gradient at bottom for depth */}
            <div 
              className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClubhouseSkeletonShimmer;
