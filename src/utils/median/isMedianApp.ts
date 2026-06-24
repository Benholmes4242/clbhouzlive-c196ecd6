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

/**
 * Checks if the Median bridge is ready for commands.
 * Call this before using any median.* bridge methods.
 */
export function isMedianBridgeReady(): boolean {
  return typeof (window as any).median !== 'undefined';
}

/**
 * Returns the platform: 'ios', 'android', or 'web'
 */
export function getMedianPlatform(): 'ios' | 'android' | 'web' {
  const ua = navigator.userAgent.toLowerCase();
  if (!isMedianApp()) return 'web';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}
