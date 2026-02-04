/**
 * Safe Area Constants - Single Source of Truth
 * 
 * Centralized safe area calculations to replace scattered env() calls
 * and hardcoded pixel values across the codebase.
 */

// ============================================
// CSS CUSTOM PROPERTIES
// ============================================

/**
 * Safe area insets - uses CSS variables set by useGlobalSafeAreas hook
 * with proper fallbacks for reliability across all contexts (including portals)
 * 
 * IMPORTANT: Use var(--sat) instead of raw env() because:
 * 1. The hook provides a 55px fallback for non-notch devices
 * 2. Portals and certain contexts can fail to resolve env() properly
 */
export const SAFE_AREA = {
  /** Top safe area - uses --sat variable with fallback chain */
  TOP: 'var(--sat, env(safe-area-inset-top, 0px))',
  /** Bottom safe area - hardcoded 25px as per app standard */
  BOTTOM: 'var(--sab, 25px)',
  /** Left safe area */
  LEFT: 'var(--sal, env(safe-area-inset-left, 0px))',
  /** Right safe area */
  RIGHT: 'var(--sar, env(safe-area-inset-right, 0px))',
  
  /** Standard header height (55px) */
  HEADER_HEIGHT: '55px',
  
  /** Combined header + top safe area */
  HEADER_TOTAL: 'calc(55px + var(--sat, env(safe-area-inset-top, 0px)))',
  
  /** Hardcoded bottom safe area fallback (matches AppShell) */
  BOTTOM_FALLBACK: '25px',
} as const;


// ============================================
// CSS VARIABLE REFERENCES
// ============================================

/**
 * CSS custom property references (defined by AppShell)
 * Use when you need runtime values
 */
export const CSS_VARS = {
  /** Top safe area (--sat) */
  TOP: 'var(--sat, env(safe-area-inset-top, 0px))',
  /** Bottom safe area (--sab) */
  BOTTOM: 'var(--sab, 25px)',
  /** Header height */
  HEADER_HEIGHT: 'var(--header-height, 55px)',
} as const;


// ============================================
// STYLE HELPERS
// ============================================

/**
 * Pre-built style objects for common patterns
 */
export const safeAreaStyles = {
  /** Add top safe area padding */
  topPadding: { paddingTop: SAFE_AREA.TOP },
  
  /** Add bottom safe area padding */
  bottomPadding: { paddingBottom: SAFE_AREA.BOTTOM },
  
  /** Add both top and bottom safe area padding */
  verticalPadding: {
    paddingTop: SAFE_AREA.TOP,
    paddingBottom: SAFE_AREA.BOTTOM,
  },
  
  /** Position element below header (for fixed elements) */
  belowHeader: { top: SAFE_AREA.HEADER_TOTAL },
  
  /** Position element at top with safe area offset + custom margin */
  topWithMargin: (marginPx: number) => ({
    top: `calc(${SAFE_AREA.TOP} + ${marginPx}px)`,
  }),
  
  /** Position element at bottom with safe area offset + custom margin */
  bottomWithMargin: (marginPx: number) => ({
    bottom: `calc(${SAFE_AREA.BOTTOM} + ${marginPx}px)`,
  }),

  /**
   * Hero bleed pattern - makes hero extend behind header/safe area
   * @param heroHeight - CSS height value (e.g., '72dvh', '16rem')
   * @param hasHeader - Whether page has a 55px header
   */
  heroBleed: (heroHeight = '72dvh', hasHeader = true): React.CSSProperties => {
    const headerOffset = hasHeader ? SAFE_AREA.HEADER_HEIGHT : '0px';
    return {
      height: `calc(${heroHeight} + ${headerOffset} + ${SAFE_AREA.TOP})`,
      minHeight: hasHeader ? `calc(420px + ${headerOffset} + ${SAFE_AREA.TOP})` : `calc(420px + ${SAFE_AREA.TOP})`,
      maxHeight: hasHeader ? `calc(600px + ${headerOffset} + ${SAFE_AREA.TOP})` : `calc(600px + ${SAFE_AREA.TOP})`,
      marginTop: `calc(-${headerOffset} - ${SAFE_AREA.TOP})`,
    };
  },
  
  /**
   * Content padding inside hero - ensures content sits below notch
   * @param hasHeader - Whether page has a 55px header
   */
  heroContent: (hasHeader = true): React.CSSProperties => ({
    paddingTop: hasHeader 
      ? `calc(${SAFE_AREA.HEADER_HEIGHT} + ${SAFE_AREA.TOP})`
      : SAFE_AREA.TOP,
  }),
  
  /**
   * Full viewport fixed container (for overlays/modals)
   */
  fixedFullscreen: (zIndex = 9999): React.CSSProperties => ({
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex,
  }),
} as const;


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create calc() expression for top offset with safe area
 */
export function withTopSafeArea(offsetPx: number): string {
  return `calc(${SAFE_AREA.TOP} + ${offsetPx}px)`;
}

/**
 * Create calc() expression for bottom offset with safe area
 */
export function withBottomSafeArea(offsetPx: number): string {
  return `calc(${SAFE_AREA.BOTTOM} + ${offsetPx}px)`;
}

/**
 * Create calc() expression for offset below header
 */
export function belowHeader(offsetPx = 0): string {
  if (offsetPx === 0) {
    return SAFE_AREA.HEADER_TOTAL;
  }
  return `calc(${SAFE_AREA.HEADER_TOTAL} + ${offsetPx}px)`;
}
