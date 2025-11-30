// F1: Cleanup utilities for global event listeners
// This file provides cleanup functions for global listeners in echoDocNavHeight.ts

let listeners: (() => void)[] = [];

export function cleanupGlobalListeners() {
  listeners.forEach(cleanup => cleanup());
  listeners = [];
}

export function registerCleanup(cleanup: () => void) {
  listeners.push(cleanup);
}

// Re-export the original function for backwards compatibility
export { setNavHeightVar } from './echoDocNavHeight';
