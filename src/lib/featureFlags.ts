/**
 * Feature flags for the application
 * These control experimental or test-only features
 */

// Enable verification bypass button in admin panel (test mode only)
// Set to false for production deployments
export const ENABLE_VERIFICATION_BYPASS = false;

// Enable mock videos in Videos tab sections (for UI testing)
// Set to false for production deployments
export const ENABLE_MOCK_VIDEOS = false; // ⚠️ DISABLED for testing real data

/**
 * Suggested feed version switch.
 * `?feed=v3` persists v3 on the device; `?feed=v2` reverts. Default: v2.
 */
export function getFeedVersion(): 'v2' | 'v3' {
  try {
    const url = new URLSearchParams(window.location.search).get('feed');
    if (url === 'v3' || url === 'v2') {
      localStorage.setItem('clbhouz.feedVersion', url);
    }
    return localStorage.getItem('clbhouz.feedVersion') === 'v3' ? 'v3' : 'v2';
  } catch {
    return 'v2';
  }
}
