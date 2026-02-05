import { isMedianApp } from '@/utils/median/isMedianApp';

export const BETA_ACCESS_KEY = 'clbhouz_beta_access';
const BETA_CODE = 'clbhouz2025**';

/**
 * Robust native platform detection using Median.co detection
 * Falls back to checking the user agent for native app indicators
 */
export function isNativePlatform(): boolean {
  // Method 1: Median.co detection (primary for our app)
  if (isMedianApp()) {
    return true;
  }
  
  // Method 2: Check for native-like user agents
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    // Check for iOS WebView indicators
    if (ua.includes('iphone') && (ua.includes('mobile') && !ua.includes('safari'))) {
      return true;
    }
    // Check for Android WebView
    if (ua.includes('android') && ua.includes('wv')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if user has beta access.
 * Returns true if:
 * - Running as native app (TestFlight/App Store/Play Store)
 * - OR localStorage has valid beta access
 */
export function hasBetaAccess(): boolean {
  // Always allow access on native apps (TestFlight/App Store)
  if (isNativePlatform()) {
    return true;
  }
  
  // On web, check for stored beta access
  if (typeof window !== 'undefined') {
    return localStorage.getItem(BETA_ACCESS_KEY) === 'true';
  }
  
  return false;
}

/**
 * Validate beta code and grant access if correct
 */
export function validateBetaCode(code: string): boolean {
  if (code === BETA_CODE) {
    try {
      localStorage.setItem(BETA_ACCESS_KEY, 'true');
    } catch {
      // localStorage might be unavailable
    }
    return true;
  }
  return false;
}

/**
 * Clear beta access (for testing)
 */
export function clearBetaAccess(): void {
  try {
    localStorage.removeItem(BETA_ACCESS_KEY);
  } catch {
    // Ignore
  }
}
