/**
 * Hero Styles Constants
 * Centralized hero container styles for Tour Hub
 * 
 * Full-bleed: Hero image extends to absolute top of viewport (behind status bar)
 * Content uses safe-area padding to stay below the notch
 * 
 * Two variants:
 * - container: For pages WITH a header (hero bleeds behind header + safe area)
 * - containerNoHeader: For pages WITHOUT a header (hero only bleeds behind safe area)
 */

/** Header height that hero needs to bleed behind */
export const HEADER_HEIGHT = 55;

/** Base hero height values */
export const HERO_HEIGHT = '72dvh';
export const HERO_MIN_HEIGHT = 420;
export const HERO_MAX_HEIGHT = 600;

/** For pages WITH a header (hero bleeds behind header + safe area) */
export const HERO_BLEED_MARGIN_WITH_HEADER = `calc(-${HEADER_HEIGHT}px - env(safe-area-inset-top, 0px))`;

/** For pages WITHOUT a header (only compensate for safe area padding from AppShell) */
export const HERO_BLEED_MARGIN_NO_HEADER = `calc(-1 * env(safe-area-inset-top, 0px))`;

export const HERO_STYLES = {
  /** Hero container - for pages WITH header (bleeds behind header + safe area) */
  container: {
    marginTop: HERO_BLEED_MARGIN_WITH_HEADER,
    height: `calc(${HERO_HEIGHT} + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
    minHeight: `calc(${HERO_MIN_HEIGHT}px + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
    maxHeight: `calc(${HERO_MAX_HEIGHT}px + ${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
  },
  /** Hero container - for pages WITHOUT header (only bleeds behind safe area) */
  containerNoHeader: {
    marginTop: HERO_BLEED_MARGIN_NO_HEADER,
    height: `calc(${HERO_HEIGHT} + env(safe-area-inset-top, 0px))`,
    minHeight: `calc(${HERO_MIN_HEIGHT}px + env(safe-area-inset-top, 0px))`,
    maxHeight: `calc(${HERO_MAX_HEIGHT}px + env(safe-area-inset-top, 0px))`,
  },
  /** Content inside hero should use this to stay below notch */
  content: {
    paddingTop: 'env(safe-area-inset-top)',
  },
} as const;
