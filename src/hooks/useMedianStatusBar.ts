import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    median?: any;
    median_library_ready?: () => void;
  }
}

// Global shield element reference — set once, never cleared
const getShield = (): HTMLElement | null =>
  document.getElementById('safe-area-shield');

// Single source of truth for current status bar color
export let currentShieldColor = '#000000';

export function applyShieldColor(color: string) {
  currentShieldColor = color;
  const shield = getShield();
  if (shield) shield.style.backgroundColor = color;
}

/**
 * Reset shield to transparent — called on every route change as a baseline.
 * Individual page hooks then opt-in to their own color on top.
 */
export function resetShieldToTransparent() {
  applyShieldColor('transparent');
}

function toAARRGGBB(hex: string) {
  if (hex.toLowerCase() === 'transparent') return '00000000';
  const clean = hex.replace('#', '').trim();
  if (clean.length === 8) return clean.toUpperCase();
  if (clean.length !== 6) return 'FF000000';
  return `FF${clean.toUpperCase()}`;
}

function applyMedianStatusBar(style: string, hexColor: string, overlay: boolean, blur: boolean) {
  if (typeof window === 'undefined') return;
  if (!navigator.userAgent.toLowerCase().includes('median')) return;

  try {
    if (window.median?.statusbar?.set) {
      window.median.statusbar.set({
        style,
        color: toAARRGGBB(hexColor),
        overlay,
        blur,
      });
    }
  } catch {
    // Median bridge not ready — fail silently
  }
}

/**
 * useMedianStatusBar — manages Median.co status bar + persistent safe-area shield.
 *
 * CRITICAL: The cleanup function intentionally does NOT reset html/body/shield
 * backgrounds. The next hook invocation overwrites them. Resetting to '' was the
 * root cause of the grey flash on app resume.
 */
export function useMedianStatusBar(
  style: 'light' | 'dark' | 'auto',
  hexColor: string,
  overlay = false,
  blur = false,
  enabled = true,
  /** Optional key — when this changes, the effect re-fires.
   * Pass location.pathname for keep-alive pages (e.g. Clubhouse)
   * so the status bar is re-applied on every navigation back. */
  reapplyKey?: string | number,
) {
  const configRef = useRef({ style, hexColor, overlay, blur, enabled });
  configRef.current = { style, hexColor, overlay, blur, enabled };

  useEffect(() => {
    if (!enabled) return;

    const apply = () => {
      const c = configRef.current;
      if (!c.enabled) return;

      const color = c.hexColor === 'transparent' ? 'transparent' : (c.hexColor || '#000000');

      // 1. Update the persistent shield — this NEVER gets cleaned up
      applyShieldColor(color);

      // 2. Update Median native status bar
      applyMedianStatusBar(c.style, c.hexColor, c.overlay, c.blur);

      // 3. Belt + suspenders: paint html/body to match (iOS WebView compositing)
      const paintColor = color === 'transparent' ? '#000000' : color;
      document.documentElement.style.backgroundColor = paintColor;
      document.body.style.backgroundColor = paintColor;

      // 4. Update theme-color meta for iOS
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', color);
      }
    };

    // Apply immediately
    apply();

    // Register Median's async ready callback
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      if (typeof prev === 'function') prev();
      apply();
    };

    // Failsafe retries for SPA navigation
    const t1 = setTimeout(apply, 250);
    const t2 = setTimeout(apply, 750);

    // Re-apply on visibility restore (single retry is sufficient)
    const handleVisibility = () => {
      if (!document.hidden) {
        apply();
        setTimeout(apply, 200);
      }
    };

    // Re-apply on focus (desktop fallback — visibilitychange handles iOS)
    const handleFocus = () => {
      if (document.hidden) return; // skip if visibility handler will fire
      apply();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);

      // ⚠️ CRITICAL: Do NOT reset html/body/shield backgrounds on cleanup.
      // The next page's useMedianStatusBar will overwrite them when it mounts.
      // Resetting to '' causes the grey flash — we never do this.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reapplyKey]); // reapplyKey allows keep-alive pages to force re-apply on nav
}
