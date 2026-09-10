/**
 * BRIEF_SHEET_BACKGROUND_CANON_03 §2 — THE SURFACE TOKENS.
 *
 * Dependency-free root for the app's dark ground. It lives in lib, not in a
 * feature folder and not in a ui primitive, because BOTH need it: a shared ui
 * primitive must not import a feature token file, and a pure-TS lib module
 * must not import a .tsx token file that pulls React in behind it.
 *
 * FOUR IDEAS, not one value four times. Today three of them hold the same
 * value. The day one moves, the choice of token at each callsite is the whole
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

/** The ground a route is painted on. Mirrors CSS `--bg-page` / `--background`. */
export const PAGE_CANVAS = '#15171F';

/** The ground a sheet is painted on. See components/ui/BottomSheet. */
export const SHEET_SURFACE = '#15171F';

/** Foreground ink for inverted controls (dark text on a light/amber chip). */
export const INK_ON_LIGHT = '#15171F';

/** Native chrome encoding (ARGB, no leading `#`) for the OS status bar. */
export const STATUS_BAR_CANVAS = 'FF15171F';
