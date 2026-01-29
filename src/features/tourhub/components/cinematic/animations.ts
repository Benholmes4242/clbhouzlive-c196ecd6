/**
 * Cinematic Animations - Premium motion configurations
 * Apple-grade spring physics and timing
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// TRANSITIONS
// ============================================================================

// Premium spring transition (Apple-style)
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// Smooth expo-out transition
export const expoOutTransition: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

// Quick snappy transition
export const snappyTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
};

// ============================================================================
// VARIANTS - Page Level
// ============================================================================

export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

export const sectionVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
};

// ============================================================================
// VARIANTS - Staggered Lists
// ============================================================================

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
};

// For horizontal scroll items
export const staggerHorizontalVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
};

// ============================================================================
// VARIANTS - Cards
// ============================================================================

export const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
  hover: {
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

export const playerCardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
};

// ============================================================================
// VARIANTS - Hero
// ============================================================================

export const heroContentVariants: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  },
};

export const heroItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
};

// Ken Burns effect for background images
export const kenBurnsVariants: Variants = {
  initial: { scale: 1.05, opacity: 0 },
  animate: { 
    scale: 1,
    opacity: 1,
    transition: { 
      scale: { duration: 20, ease: 'linear' },
      opacity: { duration: 0.8 }
    }
  },
};

// ============================================================================
// VARIANTS - Podium
// ============================================================================

export const podiumContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const podiumCardVariants: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] 
    }
  },
};

// ============================================================================
// VARIANTS - Modals / Overlays
// ============================================================================

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.15 }
  },
};

// ============================================================================
// VARIANTS - Tabs
// ============================================================================

export const tabIndicatorVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
};

export const tabContentVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate stagger delay for item index
export function getStaggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

// Create delayed animation props
export function withDelay(delay: number) {
  return {
    initial: { opacity: 0, y: 15 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay, 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] 
      }
    },
  };
}
