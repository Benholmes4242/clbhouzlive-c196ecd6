/**
 * Hides the native iOS WKWebView form accessory bar (‹ › Done above the
 * keyboard) through Median's median.keyboard.showAccessoryView(false).
 * Called from the Median ready chain in useMedianStatusBar: at module load
 * and again on median_library_ready, but it sends at most once per session.
 * A no-op on the web, Android and older builds without median.keyboard;
 * never throws. Nothing else about keyboard handling lives here.
 */
let sent = false;

export function hideKeyboardAccessoryOnce(): boolean {
  if (sent || typeof window === 'undefined') return false;
  try {
    const keyboard = (window.median as { keyboard?: { showAccessoryView?: (show: boolean) => void } } | undefined)?.keyboard;
    if (typeof keyboard?.showAccessoryView !== 'function') return false;
    keyboard.showAccessoryView(false);
    sent = true;
    return true;
  } catch {
    return false;
  }
}

/** Test-only: forget the once latch. */
export function __resetKeyboardAccessoryForTest(): void { sent = false; }
