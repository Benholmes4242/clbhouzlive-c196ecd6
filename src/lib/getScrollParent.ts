/**
 * Resolves the element that actually owns document-level scrolling, at runtime.
 *
 * Why a runtime resolver instead of a hardcoded element:
 * Our CSS puts `overflow-y: auto` on BOTH html and body (src/index.css). Which of
 * those is the real scroller is engine- and mode-dependent (iOS Safari, Median
 * WKWebView, Android WebView can differ, and can change across WebView updates).
 * `document.scrollingElement` is the spec-defined answer to exactly this ambiguity
 * and stays correct as the environment changes — so window-scrolled virtualised
 * lists (react-virtuoso `customScrollParent`) anchor to the right element everywhere.
 *
 * Returns an HTMLElement suitable for passing to Virtuoso's `customScrollParent`.
 * Falls back defensively if `scrollingElement` is unavailable.
 */
export function getDocumentScrollParent(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined;

  const el = document.scrollingElement as HTMLElement | null;
  if (el instanceof HTMLElement) return el;

  // Defensive fallbacks (very old / non-standard engines).
  if (document.documentElement instanceof HTMLElement) return document.documentElement;
  if (document.body instanceof HTMLElement) return document.body;
  return undefined;
}
