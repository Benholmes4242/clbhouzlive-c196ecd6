/**
 * Hero Styles Constants
 * Centralized hero container styles for Tour Hub
 * 
 * Height: 72dvh (bleeds under status bar/notch)
 * Image fills entire container, content respects safe area
 */

export const HERO_STYLES = {
  /** Container pulls up into safe area - NO paddingTop so image bleeds to top */
  container: {
    height: 'calc(72dvh - 60px + env(safe-area-inset-top))',
    marginTop: 'calc(-55px - env(safe-area-inset-top))',
    minHeight: '300px',
  },
  /** Content inside hero should use this to stay below notch */
  content: {
    paddingTop: 'env(safe-area-inset-top)',
  },
} as const;
