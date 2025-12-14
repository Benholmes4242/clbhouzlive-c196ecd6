/**
 * Clubhouse Cinema Dim – Regression Lock Spec
 * 
 * "Clubhouse is cinematic by hierarchy, not by hiding chrome:
 * header/footer remain static; dim mode uses hard RGBA values
 * with blur/gradient explicitly removed."
 * 
 * NON-NEGOTIABLES:
 * - Header + footer are always visible (never slide, never hide)
 * - Cinema Dim is a style-only state (no layout shift)
 * - No gesture to reveal/hide chrome
 * - Glass capsule + right action rail are out of scope
 */

// ============================================================================
// DIM MODE BACKGROUNDS (Hard RGBA - no CSS variables for iOS reliability)
// ============================================================================

export const CINEMA_DIM = {
  /** Header background in dim mode */
  headerBg: 'rgba(15, 15, 15, 0.10)',
  
  /** Footer background in dim mode */
  footerBg: 'rgba(15, 15, 15, 0.10)',
  
  /** Border color in dim mode */
  border: 'rgba(255, 255, 255, 0.06)',
  
  /** Icon color in dim mode */
  iconColor: 'rgba(255, 255, 255, 0.55)',
  
  /** Label color in dim mode */
  labelColor: 'rgba(255, 255, 255, 0.42)',
  
  /** Active icon/label color in dim mode */
  activeColor: 'rgba(255, 255, 255, 0.78)',
} as const;

// ============================================================================
// STANDARD MODE BACKGROUNDS
// ============================================================================

export const CINEMA_STANDARD = {
  /** Header background in standard mode */
  headerBg: 'rgba(10, 10, 10, 0.95)',
  
  /** Footer background in standard mode */
  footerBg: 'rgba(15, 15, 15, 0.95)',
  
  /** Border color in standard mode */
  border: 'rgba(255, 255, 255, 0.06)',
  
  /** Blur value for standard mode */
  blur: 'blur(20px)',
} as const;

// ============================================================================
// TRANSITION CONTRACT (Slow + Soft)
// ============================================================================

export const CINEMA_TRANSITION = {
  /** Duration in milliseconds */
  durationMs: 800,
  
  /** CSS duration string */
  duration: '800ms',
  
  /** Easing function */
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  
  /** Full transition string for background, color, border */
  full: 'background-color 800ms cubic-bezier(0.22, 1, 0.36, 1), color 800ms cubic-bezier(0.22, 1, 0.36, 1), border-color 800ms cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

// ============================================================================
// BEHAVIOUR CONTRACT (Timers)
// ============================================================================

export const CINEMA_TIMERS = {
  /** Delay before entering dim mode after page load */
  enterDimDelayMs: 4000,
  
  /** Delay before reverting to dim after interaction */
  revertDimDelayMs: 6000,
} as const;

// ============================================================================
// HELPER: Get header inline styles
// ============================================================================

export function getHeaderDimStyles(isDimmed: boolean): React.CSSProperties {
  return {
    background: isDimmed ? CINEMA_DIM.headerBg : CINEMA_STANDARD.headerBg,
    backdropFilter: isDimmed ? 'none' : CINEMA_STANDARD.blur,
    WebkitBackdropFilter: isDimmed ? 'none' : CINEMA_STANDARD.blur,
    borderBottom: `1px solid ${isDimmed ? CINEMA_DIM.border : CINEMA_STANDARD.border}`,
    boxShadow: isDimmed ? 'none' : undefined,
    transition: CINEMA_TRANSITION.full,
  };
}

// ============================================================================
// HELPER: Get footer inline styles
// ============================================================================

export function getFooterDimStyles(isDimmed: boolean): React.CSSProperties {
  return {
    background: isDimmed ? CINEMA_DIM.footerBg : CINEMA_STANDARD.footerBg,
    backdropFilter: isDimmed ? 'none' : undefined,
    WebkitBackdropFilter: isDimmed ? 'none' : undefined,
    transition: CINEMA_TRANSITION.full,
  };
}
