// Post Studio Constants
// Re-exports from the canonical source + studio-specific config

export {
  POST_LIMITS,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
  validateMediaFile,
  formatBytes,
  formatDuration,
} from '@/constants/postLimits';

/** Spring presets for framer-motion animations */
export const SPRING = {
  /** Studio open/close sheet */
  sheet: { damping: 32, stiffness: 320 },
  /** Bottom panels */
  panel: { damping: 30, stiffness: 300 },
  /** Mention pill insertion */
  pill: { damping: 25, stiffness: 400 },
} as const;

/** Animation durations */
export const DURATION = {
  /** Screen transition slide */
  screenTransition: 0.22,
  /** Backdrop fade */
  backdrop: 0.2,
  /** Success checkmark */
  successCheck: 0.6,
} as const;

/** Media preview aspect ratios */
export const ASPECT_RATIO = {
  video: 16 / 9,
  image: 1,
} as const;

/** Thumbnail size for MediaReel */
export const REEL_THUMB_SIZE = 64;

/** Minimum tap target size (px) */
export const MIN_TAP_TARGET = 44;
