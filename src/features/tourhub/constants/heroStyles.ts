/**
 * Hero Styles Constants
 * Centralized hero container styles for Tour Hub
 * 
 * Full-bleed: Hero image extends to absolute top of viewport (behind status bar)
 * Content uses safe-area padding to stay below the notch
 */

/** Header height that hero needs to bleed behind */
export const HEADER_HEIGHT = 55;

/** Base hero height values */
export const HERO_HEIGHT = '72dvh';
export const HERO_MIN_HEIGHT = 420;
export const HERO_MAX_HEIGHT = 600;

/** Negative top to pull hero behind header + status bar (matches Course Details) */
export const HERO_BLEED_TOP = `calc(-${HEADER_HEIGHT}px - env(safe-area-inset-top, 0px))`;

export const HERO_STYLES = {
  /** Hero container - bleeds behind header and safe area */
  container: {
    top: HERO_BLEED_TOP,
    height: `calc(${HERO_HEIGHT} + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
    minHeight: `calc(${HERO_MIN_HEIGHT}px + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
    maxHeight: `calc(${HERO_MAX_HEIGHT}px + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
  },
  /** Content inside hero should use this to stay below notch */
  content: {
    paddingTop: 'env(safe-area-inset-top)',
  },
} as const;
