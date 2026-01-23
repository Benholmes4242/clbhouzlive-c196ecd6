import { Capacitor } from '@capacitor/core';

const BETA_ACCESS_KEY = 'clbhouz_beta_access';
const BETA_CODE = 'clbhouz2025**';

/**
 * Check if user has beta access.
 * Returns true if:
 * - Running as native app (TestFlight/App Store/Play Store)
 * - OR localStorage has valid beta access
 */
export function hasBetaAccess(): boolean {
  // Native apps always have access (TestFlight, App Store, Play Store)
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // Check localStorage for web users
  try {
    return localStorage.getItem(BETA_ACCESS_KEY) === 'true';
  } catch {
    return false;
  }
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
 * Check if running on native platform
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
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
