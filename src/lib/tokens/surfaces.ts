/**
 * BRIEF_SHEET_BACKGROUND_CANON_03 §2 — THE SURFACE TOKENS.
 *
 * Dependency-free root for the app's dark ground. It lives in lib, not in a
 * feature folder and not in a ui primitive, because BOTH need it: a shared ui
 * primitive must not import a feature token file, and a pure-TS lib module
 * must not import a .tsx token file that pulls React in behind it.
 *
 * SURFACE ROLES, not a palette of interchangeable values. Several roles hold
 * the same value today. The day one moves, the choice at each callsite is the whole
 * difference between a correct repaint and a visible seam — so pick by WHAT
 * THE ELEMENT IS, never by what the value currently is.
 *
 *   PAGE_CANVAS        the ground a ROUTE is painted on.
 *   SHEET_SURFACE      the ground a SHEET is painted on (re-exported by
 *                      components/ui/BottomSheet, which is the canon for
 *                      sheets; import it from there inside sheet code).
 *   INK_ON_LIGHT       a FOREGROUND colour: text or a glyph sitting on a
 *                      light or amber chip. Not a surface at all — it is the
 *                      dark ink of an inverted control, and it would NOT
 *                      follow the canvas if the canvas were lightened.
 *   STATUS_BAR_CANVAS  the native chrome value (ARGB, no `#`) handed to the
 *                      status bar / theme-color. Same colour, different
 *                      encoding, different owner (the OS, not the DOM).
 */

/** The ground a route is painted on. Mirrors CSS `--bg-page`; `--background` is a separately encoded legacy semantic. */
export const PAGE_CANVAS = '#0A0A0C';

/** The ground a sheet is painted on. See components/ui/BottomSheet. */
export const SHEET_SURFACE = '#16161A';

/** Foreground ink for inverted controls (dark text on a light/amber chip). */
export const INK_ON_LIGHT = '#0A0A0C';

/** Native chrome encoding (ARGB, no leading `#`) for the OS status bar. */
export const STATUS_BAR_CANVAS = 'FF0A0A0C';

/** Raised analytical cards and panels on the standard member canvas. */
export const MEMBER_PANEL = '#16161A';

/** Cells and chips raised above a member sheet or panel. */
export const MEMBER_CELL = '#1E1E23';

/** The full-screen near-black ground used by Clubhouse, Messages, and Echo. */
export const IMMERSIVE_FEED_CANVAS = '#0A0A0C';

/** Opaque post cards, editorial slides, and Echo chart panels on the feed canvas. */
export const FEED_CARD_SURFACE = '#16161A';

/** Raised result cards and controls inside Echo. */
export const ECHO_RAISED_SURFACE = '#27272E';

/** The outer shell behind the unified post and review composer. */
export const COMPOSER_SHELL_SURFACE = '#0A0A0C';

/** Raised trays, cards, and mention results inside the unified composer. */
export const COMPOSER_PANEL_SURFACE = '#16161A';

/** Legacy app-shell paint retained behind member routes during first layout. */
export const APP_SHELL_SURFACE = '#0A0A0C';

/** Desktop gutter outside the constrained member app column. */
export const DESKTOP_GUTTER_SURFACE = '#0A0A0C';

/** Near-black fill for compact controls, notices, and branded utility tiles. */
export const NEAR_BLACK_CONTROL_SURFACE = '#1E1E23';

/** Near-black shell behind Discover tabs and feed chrome. */
export const DISCOVER_SHELL_SURFACE = '#0A0A0C';

/** Raised near-black card tier used by Tour Hub's dark surface stack. */
export const TOUR_HUB_RAISED_SURFACE = '#16161A';

/** Light compatibility route canvas retained for inactive legacy branches. */
export const LIGHT_ROUTE_CANVAS = '#F8FAFC';

/** Dark ink canvas retained by the light immersive-status-bar compatibility branch. */
export const LIGHT_IMMERSIVE_CANVAS = '#0F172A';

/** Opaque slate fill for controls and utility cards on light member surfaces. */
export const SLATE_CONTROL_SURFACE = '#1E1E23';

/** Full-screen ground used while resolving a direct post link. */
export const POST_DEEP_LINK_CANVAS = '#0A0A0C';

/** Full-screen account-suspension page and its appeal sheet. */
export const SUSPENSION_SURFACE = '#0A0A0C';

/** Full-screen ground used by Echo chat history. */
export const ECHO_HISTORY_CANVAS = '#0A0A0C';

/** Sheet and empty-state tile surface used by Echo chat history. */
export const ECHO_HISTORY_PANEL = '#16161A';

/** Secondary action surface inside the Echo history sheet. */
export const ECHO_HISTORY_ACTION = '#1E1E23';

/** Native chrome encoding of the near-black Clubhouse, Messages, and Echo canvas. */
export const IMMERSIVE_FEED_STATUS_BAR = 'FF0A0A0C';

/** Native chrome encoding of the retained light compatibility route canvas. */
export const LIGHT_ROUTE_STATUS_BAR = 'FFF8FAFC';

/** Preserve a token's RGB channels while applying an explicit alpha stop. */
export function surfaceWithAlpha(hex: string, alpha: number): string {
  const channels = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!channels) return hex;
  const [, red, green, blue] = channels;
  return `rgba(${parseInt(red, 16)},${parseInt(green, 16)},${parseInt(blue, 16)},${alpha})`;
}

/** Preserve a FOREGROUND ink colour's RGB channels while applying an explicit alpha. */
export function inkWithAlpha(hex: string, alpha: number): string {
  const channels = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!channels) return hex;
  const [, red, green, blue] = channels;
  return `rgba(${parseInt(red, 16)},${parseInt(green, 16)},${parseInt(blue, 16)},${alpha})`;
}
