// Framer Motion variants extracted from ProfileModalRouter
import { Variants, Transition } from 'framer-motion';
import { MODAL_ANIMATION } from './constants';

// Panel slide animation variants (exact copy from ProfileModalRouter)
export const panelVariants: Variants = {
  closed: {
    x: MODAL_ANIMATION.initialX, // "100%" - off-screen right
  },
  open: {
    x: MODAL_ANIMATION.animateX,  // 0 - on-screen position
  },
};

// Transition configuration (exact copy from ProfileModalRouter)
export const transition: Transition = {
  type: MODAL_ANIMATION.type,     // "tween"
  duration: MODAL_ANIMATION.duration, // 0.25
  ease: MODAL_ANIMATION.ease,     // "easeInOut"
};

// Overlay variants (ProfileModalRouter uses no animation)
export const overlayVariants: Variants = {
  closed: {
    opacity: MODAL_ANIMATION.overlayInitial, // 1 - no fade
  },
  open: {
    opacity: MODAL_ANIMATION.overlayAnimate, // 1 - no fade
  },
};

// Combined animation for components that need both panel and overlay
export const modalContainerVariants: Variants = {
  closed: {
    x: MODAL_ANIMATION.initialX,
  },
  open: {
    x: MODAL_ANIMATION.animateX,
  },
  exit: {
    x: MODAL_ANIMATION.exitX,
  },
};