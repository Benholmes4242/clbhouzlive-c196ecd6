/**
 * Premium Motion Utilities
 * 
 * Consistent, subtle, premium motion language for data-heavy UI.
 * Think Apple Fitness / Strava / Apple Maps level restraint.
 * 
 * Core principles:
 * - Never animate from 0 unless semantic (animate from prev value or 85% of value)
 * - Keep durations short (450-900ms max)
 * - Soft ease-out easing, no bounce/spring/elastic
 * - Only animate once per mount (no re-animation on scroll re-entry)
 */
import type { Variants } from 'framer-motion';

export { AnimatedNumber, default as AnimatedNumberDefault } from './AnimatedNumber';
export { AnimatedProgressBar, default as AnimatedProgressBarDefault } from './AnimatedProgressBar';
export { AnimatedProgressRing, default as AnimatedProgressRingDefault } from './AnimatedProgressRing';

// Re-export animation variants for containers (properly typed)
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const fadeSlideItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

// Utility for staggered delays
export const getStaggerDelay = (index: number, baseDelay = 0.04): number => {
  return baseDelay + index * 0.06;
};
