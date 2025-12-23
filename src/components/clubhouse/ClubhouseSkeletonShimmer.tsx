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
 * Skeleton block with shimmer animation
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
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }}
      />
    )}
  </div>
);

/**
 * Action rail skeleton - matches CinematicActionRail layout
 */
const ActionRailSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => {
  const slots = [
    { size: 44, hasCount: false }, // Mute
    { size: 44, hasCount: true },  // Like
    { size: 44, hasCount: true },  // Comment
    { size: 44, hasCount: false }, // Share
    { size: 44, hasCount: false }, // Save
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <SkeletonBlock 
            isStatic={isStatic}
            className="rounded-full"
            style={{ width: slot.size, height: slot.size }}
          />
          {slot.hasCount && (
            <SkeletonBlock 
              isStatic={isStatic}
              className="rounded-sm"
              style={{ width: 24, height: 12 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Creator capsule skeleton - matches CreatorCapsule layout
 */
const CreatorCapsuleSkeleton: React.FC<{ isStatic?: boolean }> = ({ isStatic }) => (
  <div 
    className="flex flex-col gap-2 p-3 rounded-2xl bg-black/40 backdrop-blur-sm"
    style={{ maxWidth: 280 }}
  >
    {/* Top row: avatar + username */}
    <div className="flex items-center gap-2">
      <SkeletonBlock 
        isStatic={isStatic}
        className="rounded-lg shrink-0"
        style={{ width: 32, height: 32 }}
      />
      <div className="flex flex-col gap-1.5 flex-1">
        <SkeletonBlock 
          isStatic={isStatic}
          className="rounded-sm"
          style={{ width: 100, height: 12 }}
        />
        <SkeletonBlock 
          isStatic={isStatic}
          className="rounded-sm"
          style={{ width: 140, height: 10 }}
        />
      </div>
    </div>
    
    {/* Caption line */}
    <SkeletonBlock 
      isStatic={isStatic}
      className="rounded-sm"
      style={{ width: '90%', height: 10 }}
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
  // Add keyframes to document if not already present
  React.useEffect(() => {
    const styleId = 'clubhouse-skeleton-shimmer-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute inset-0 z-50 pointer-events-none",
            "bg-[#0F0F0F]", // Same as Clubhouse background
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
            
            {/* Right-side action rail - positioned like CinematicActionRail */}
            <div 
              className="absolute right-3 flex flex-col items-center"
              style={{ 
                top: '50%', 
                transform: 'translateY(-50%)',
              }}
            >
              <ActionRailSkeleton isStatic={isStatic} />
            </div>
            
            {/* Bottom-left creator capsule - positioned like CreatorCapsule */}
            <div 
              className="absolute left-3"
              style={{ 
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
              }}
            >
              <CreatorCapsuleSkeleton isStatic={isStatic} />
            </div>
            
            {/* Optional: subtle gradient at bottom for depth */}
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
