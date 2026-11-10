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

/** Used until the island row has been measured (single 46px capsule). */
export const CHROME_ISLAND_H_FALLBACK = 46;

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

/**
 * The same clearance as a NUMBER of px, for scroll maths that cannot consume
 * a CSS length. ChromeIsland publishes --chrome-clearance as a calc() string
 * (e.g. "calc(var(--sat, 0px) + 72px)"), so parseFloat alone can never resolve
 * it. Read the raw value; "0px" (chrome-less routes) returns 0; anything else
 * is measured through a probe div whose height is CHROME_CLEARANCE, letting
 * the browser resolve the calc. Falls back to the unmeasured island height +
 * gap + breathing when unset or when the probe measures 0. Cached on the raw
 * string + viewport so repeated scroll-time calls do not re-measure.
 */
const CHROME_CLEARANCE_PX_FALLBACK = CHROME_ISLAND_H_FALLBACK + CHROME_TOP_GAP + CHROME_BREATHING;

let clearanceCache: { raw: string; w: number; h: number; px: number } | null = null;

export function chromeClearancePx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(CHROME_CLEARANCE_VAR);
  if (raw.trim() === '0px') return 0;
  if (
    clearanceCache &&
    clearanceCache.raw === raw &&
    clearanceCache.w === window.innerWidth &&
    clearanceCache.h === window.innerHeight
  ) {
    return clearanceCache.px;
  }
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:${CHROME_CLEARANCE}`;
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  const px = height > 0 ? height : CHROME_CLEARANCE_PX_FALLBACK;
  clearanceCache = { raw, w: window.innerWidth, h: window.innerHeight, px };
  return px;
}
