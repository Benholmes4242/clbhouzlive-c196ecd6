/**
 * THE ONE BOTTOM CLEARANCE.
 *
 * The bottom control is a FLOATING pill: it sits 20px off the bottom edge, so a
 * page's last row must clear the pill's own height, that 20px gap, the home
 * indicator, and a breathing gap — never a magic number typed per page.
 *
 * `--nav-pill-h` is measured from the live pill by GlobalBottomNavigation, so
 * when the pill grows (labels, a taller glyph) every page that consumes this
 * token moves with it and nothing has to be re-tuned.
 *
 * Consume it as a CSS length: `paddingBottom: NAV_CLEARANCE`.
 */

/** Gap between the pill and the bottom edge (matches the pill's `bottom`). */
export const NAV_PILL_BOTTOM = 20;

/** Breathing room between the last row and the pill's top edge. */
export const NAV_BREATHING = 16;

/** Used until the pill has been measured (labelled pill ≈ 64px tall). */
export const NAV_PILL_H_FALLBACK = 64;

/** CSS custom property the pill writes its measured height into. */
export const NAV_PILL_H_VAR = '--nav-pill-h';

/**
 * Total space to reserve at the foot of any scrollable page while the bottom
 * control is visible. Includes the home indicator.
 */
export const NAV_CLEARANCE =
  `calc(var(${NAV_PILL_H_VAR}, ${NAV_PILL_H_FALLBACK}px) + ${NAV_PILL_BOTTOM + NAV_BREATHING}px + env(safe-area-inset-bottom, 0px))`;
