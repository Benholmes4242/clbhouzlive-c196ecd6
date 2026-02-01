/**
 * Hero Styles Constants
 * Centralized hero container styles for Tour Hub
 * 
 * Full-bleed: Hero image extends to absolute top of viewport (behind status bar)
 * Content uses safe-area padding to stay below the notch
 */

export const HERO_STYLES = {
  /** Hero container - absolute positioned from true top of screen */
  container: {
    height: '72dvh',
    minHeight: '420px',
    maxHeight: '600px',
  },
  /** Content inside hero should use this to stay below notch */
  content: {
    paddingTop: 'env(safe-area-inset-top)',
  },
} as const;

/**
 * Hero height for margin calculations in content below
 * This should match container.height for proper overlap
 */
export const HERO_HEIGHT = '72dvh';
export const HERO_MIN_HEIGHT = 420;
export const HERO_MAX_HEIGHT = 600;
