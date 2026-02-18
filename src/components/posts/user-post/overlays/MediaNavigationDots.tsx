import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MediaNavigationDotsProps {
  mediaCount: number;
  currentIndex: number;
  onJump?: (index: number) => void;
  bottomOffset?: number | string; // allows overriding default bottom positioning
  className?: string; // optional className to override z-index or other styles
  activeColor?: string;
  inactiveColor?: string;
}

/** Maximum number of dots visible at any time */
const MAX_VISIBLE = 5;

/**
 * Computes the sliding window of dot indices to show, and the visual
 * size/opacity for each slot in that window.
 *
 * Rules:
 *  - When mediaCount ≤ MAX_VISIBLE: show all dots normally.
 *  - When mediaCount > MAX_VISIBLE: show a 5-slot window centred on the
 *    active dot (clamped to [0, mediaCount - MAX_VISIBLE]).
 *  - Edge dots of the window (first and last slot) scale down to hint
 *    that more items exist beyond.
 */
function useWindowedDots(mediaCount: number, currentIndex: number) {
  return useMemo(() => {
    if (mediaCount <= MAX_VISIBLE) {
      // All dots visible — no condensing needed
      return Array.from({ length: mediaCount }, (_, i) => ({
        realIndex: i,
        isEdge: false,
      }));
    }

    // Centre the window on active, clamped so we never go out of bounds
    const halfWindow = Math.floor(MAX_VISIBLE / 2); // 2
    const windowStart = Math.min(
      Math.max(currentIndex - halfWindow, 0),
      mediaCount - MAX_VISIBLE
    );

    return Array.from({ length: MAX_VISIBLE }, (_, slot) => {
      const realIndex = windowStart + slot;
      // First and last slots are "edge" dots — visually smaller
      const isEdge = slot === 0 || slot === MAX_VISIBLE - 1;
      return { realIndex, isEdge };
    });
  }, [mediaCount, currentIndex]);
}

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex,
  onJump,
  bottomOffset,
  className,
  activeColor,
  inactiveColor,
}) => {
  const dots = useWindowedDots(mediaCount, currentIndex);

  if (mediaCount <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      className={`absolute z-30 pointer-events-none chrome-follow-bottom ${className ?? ''}`}
      style={{ bottom: bottomOffset ?? 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 8px)', left: 0, right: 0 }}
    >
      {/* overflow-hidden + fixed max-w guarantees no bleed at any screen size */}
      <div className="flex justify-center overflow-hidden">
        <div
          className="flex items-center gap-2 pointer-events-auto"
          role="tablist"
          aria-label="Media pagination"
        >
          {dots.map(({ realIndex, isEdge }) => {
            const isActive = realIndex === currentIndex;
            return (
              <button
                key={realIndex}
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to media ${realIndex + 1}`}
                onClick={() => onJump?.(realIndex)}
                className={`h-1.5 rounded-full transition-all duration-200 ease-out relative after:content-[''] after:absolute after:-inset-2 ${
                  isActive
                    ? `w-5 ${activeColor ?? 'bg-white'}`
                    : isEdge
                      ? `w-1 ${inactiveColor ?? 'bg-white/40'}`
                      : `w-1.5 ${inactiveColor ?? 'bg-white/60'}`
                }`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
