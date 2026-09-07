/**
 * THE ONE TOP CLEARANCE — the twin of NAV_CLEARANCE (src/lib/navClearance.ts).
 *
 * The floating glass islands sit 10px below the safe area and are 44px tall
 * today, but that changes with the notch, with a taller glyph, or with a
 * left capsule that carries a text field. So NO PAGE TYPES A NUMBER: the
 * island row measures itself into `--chrome-island-h` (ChromeIsland does the
 * measuring with a ResizeObserver) and publishes the finished, safe-area
 * inclusive clearance into `--chrome-clearance`.
 *
 * THE RULE: content STARTS below the islands and SCROLLS UNDER them after
 * that. First paint must never be covered — floating chrome sits over content
 * in motion, never over the first thing a member sees.
 *
 * SINGLE SAFE-AREA OWNER: the chrome pays env(safe-area-inset-top). A page
 * consuming CHROME_CLEARANCE must never add the inset again.
 *
 * Consume it as a CSS length: `paddingTop: CHROME_CLEARANCE`.
 */

/** Gap between the safe area and the island's top edge (matches the island's `top`). */
export const CHROME_TOP_GAP = 10;

/** Breathing room between the island's bottom edge and the first row of content. */
export const CHROME_BREATHING = 16;

/** Used until the island row has been measured (single 44px capsule). */
export const CHROME_ISLAND_H_FALLBACK = 44;

/** CSS custom property the island writes its measured height into. */
export const CHROME_ISLAND_H_VAR = '--chrome-island-h';

/** CSS custom property the island writes the finished clearance into. */
export const CHROME_CLEARANCE_VAR = '--chrome-clearance';

/**
 * Space to reserve at the top of any immersive (bleed) page that wears the
 * shared islands. Resolves to 0px on routes with no chrome, because
 * ChromeIsland publishes 0 there.
 */
export const CHROME_CLEARANCE =
  `var(${CHROME_CLEARANCE_VAR}, calc(env(safe-area-inset-top, 0px) + var(${CHROME_ISLAND_H_VAR}, ${CHROME_ISLAND_H_FALLBACK}px) + ${CHROME_TOP_GAP + CHROME_BREATHING}px))`;
