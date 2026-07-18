/**
 * Median.co Detection Utility
 *
 * Provides consistent platform detection for the Median.co native wrapper.
 * Replaces Capacitor.isNativePlatform() which doesn't work in Median's webview.
 */

/**
 * Detects if the app is running inside Median.co's native wrapper.
 * Uses the same pattern as useMedianStatusBar.ts (confirmed working).
 */
export function isMedianApp(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('median') ||
         ua.includes('gonative') ||
         typeof (window as any).median !== 'undefined' ||
         typeof (window as any).gonative !== 'undefined';
}
