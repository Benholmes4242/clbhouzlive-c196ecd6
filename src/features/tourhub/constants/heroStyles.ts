/**
 * Hero Styles Constants
 * Centralized hero container styles for Tour Hub
 * 
 * Height: 75dvh (25% reduction from 100dvh)
 * Bleeds under status bar/notch via safe-area-inset-top
 */

export const HERO_STYLES = {
  container: {
    height: 'calc(85dvh - 60px + env(safe-area-inset-top))',
    marginTop: 'calc(-55px - env(safe-area-inset-top))',
    paddingTop: 'env(safe-area-inset-top)',
    minHeight: '300px',
  },
} as const;
