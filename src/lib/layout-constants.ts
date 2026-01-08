/**
 * Layout Constants
 * Centralized spacing values for header, nav, and safe areas
 */

export const LAYOUT_CONSTANTS = {
  /** CompactHeader height for non-Clubhouse pages (40px) */
  HEADER_HEIGHT: 40,
  
  /** Clubhouse header height (55px) */
  CLUBHOUSE_HEADER_HEIGHT: 55,
  
  /** Header height as Tailwind class */
  HEADER_HEIGHT_CLASS: 'h-10',
  
  /** Content padding for pages under header */
  CONTENT_PADDING_CLASS: 'pt-10',
  
  /** Bottom navigation height */
  BOTTOM_NAV_HEIGHT: 64,
  
  /** Bottom navigation height class */
  BOTTOM_NAV_CLASS: 'h-16',
  
  /** Padding for content above bottom nav */
  BOTTOM_PADDING_CLASS: 'pb-20',
} as const;

/** CSS custom property names */
export const CSS_VARS = {
  SAFE_TOP: '--sat',
  SAFE_BOTTOM: '--sab',
  HEADER_HEIGHT: '--header-height',
} as const;
