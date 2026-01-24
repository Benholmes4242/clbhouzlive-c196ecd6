import { Capacitor } from '@capacitor/core';

export const BETA_ACCESS_KEY = 'clbhouz_beta_access';
const BETA_CODE = 'clbhouz2025**';

/**
 * Robust native platform detection with multiple fallback methods
 */
export function isNativePlatform(): boolean {
  // Method 1: Capacitor's built-in check
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // Method 2: Check the platform directly
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') {
    return true;
  }
  
  // Method 3: Check for Capacitor bridge in window (fallback)
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    return true;
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
