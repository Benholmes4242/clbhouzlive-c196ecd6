import React from 'react';
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

export const MediaNavigationDots: React.FC<MediaNavigationDotsProps> = ({
  mediaCount,
  currentIndex,
  onJump,
  bottomOffset,
  className,
  activeColor,
  inactiveColor,
}) => {
  if (mediaCount <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      className={`absolute z-30 pointer-events-none chrome-follow-bottom ${className ?? ''}`}
      style={{ bottom: bottomOffset ?? 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 8px)', left: 0, right: 0 }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
        role="tablist"
        aria-label="Media pagination"
      >
      {Array.from({ length: mediaCount }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <button
            key={index}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to media ${index + 1}`}
            onClick={() => onJump?.(index)}
            className={`h-1.5 rounded-full transition-all duration-200 ease-out relative after:content-[''] after:absolute after:-inset-2 ${
              isActive 
                ? `w-5 ${activeColor ?? 'bg-white'}` 
                : `w-1.5 ${inactiveColor ?? 'bg-white/60'}`
            }`}
          />
        );
      })}
      </div>
    </motion.div>
  );
};
