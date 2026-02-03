/**
 * useGlobalSafeAreas - Global safe area CSS variable management
 * 
 * This hook sets up the global safe area CSS variables used across the app:
 * - --sat / --safe-top: Top safe area (env() with 55px fallback for non-notch devices)
 * - --sab / --safe-bottom: Bottom safe area (hardcoded to 25px)
 * 
 * This should be called once at the app root level (AppShell or App.tsx).
 */
import { useEffect } from 'react';

const TOP_FALLBACK_PX = 55;
const BOTTOM_HARDCODED_PX = 25;

export function useGlobalSafeAreas() {
  useEffect(() => {
    // Test if env() returns a real value on this device
    const testEl = document.createElement('div');
    testEl.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    document.body.appendChild(testEl);
    const computedTop = getComputedStyle(testEl).paddingTop;
    document.body.removeChild(testEl);
    
    const envTopValue = parseInt(computedTop, 10) || 0;
    
    // Top: use fallback only if env() returns 0 (non-notch devices)
    if (envTopValue === 0) {
      document.documentElement.style.setProperty('--sat', `${TOP_FALLBACK_PX}px`);
      document.documentElement.style.setProperty('--safe-top', `${TOP_FALLBACK_PX}px`);
    } else {
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
      document.documentElement.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
    }
    
    // Bottom: hardcoded to 25px
    document.documentElement.style.setProperty('--sab', `${BOTTOM_HARDCODED_PX}px`);
    document.documentElement.style.setProperty('--safe-bottom', `${BOTTOM_HARDCODED_PX}px`);

    return () => {
      document.documentElement.style.removeProperty('--sat');
      document.documentElement.style.removeProperty('--sab');
      document.documentElement.style.removeProperty('--safe-top');
      document.documentElement.style.removeProperty('--safe-bottom');
    };
  }, []);
}
