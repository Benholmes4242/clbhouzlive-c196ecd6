/**
 * Design Review Mode Helpers
 * 
 * Use these helpers to access DRM overrides without importing from the review island.
 * This keeps the dependency graph clean and prevents circular imports.
 */

/**
 * Get design review mode overrides for a specific state
 * Safe to call even if review mode is not active
 * 
 * @example
 * const overrides = getDRMOverrides('nearby-07-golfers-list');
 * const golfers = overrides.nearbyGolfers || realGolfers;
 */
export function getDRMOverrides(stateId: string): any {
  return (window as any).__DRM?.getOverrides?.(stateId) ?? {};
}

/**
 * Get the current design review mode state
 * Returns null if review mode is not active
 */
export function getDRMState(): { id: string } | null {
  return (window as any).__DRM?.getState?.() ?? null;
}

/**
 * Check if design review mode is currently active
 */
export function isDRMActive(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__DRM;
}
