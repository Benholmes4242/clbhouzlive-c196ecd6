/**
 * Cinematic Motion Tokens
 * Standardized timing and easing values for premium animations
 */

// Duration tokens (in milliseconds)
export const MOTION_FAST = 140;
export const MOTION_MED = 200;
export const MOTION_SLOW = 260;

// Easing curves (cubic bezier arrays for Framer Motion)
export const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Spring presets for common use cases
export const SPRING_SNAPPY = { type: 'spring' as const, damping: 28, stiffness: 300, mass: 0.8 };
export const SPRING_GENTLE = { type: 'spring' as const, damping: 25, stiffness: 200, mass: 1 };

// Framer Motion transition helpers
export const fadeIn = (duration = MOTION_MED) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration / 1000, ease: EASE_OUT }
});

export const slideUp = (distance = 10, duration = MOTION_MED) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: distance },
  transition: { duration: duration / 1000, ease: EASE_OUT }
});

// Like pop animation preset
export const likePop = {
  scale: [1, 1.12, 1],
  transition: { duration: MOTION_FAST / 1000, ease: EASE_OUT }
};

// Press feedback preset
export const pressFeedback = {
  scale: 0.96,
  transition: { duration: MOTION_FAST / 1000, ease: EASE_OUT }
};
