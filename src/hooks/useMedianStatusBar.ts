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
let currentShieldColor = '#000000';

function applyShieldColor(color: string) {
  currentShieldColor = color;
  const shield = getShield();
  if (shield) shield.style.backgroundColor = color;
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
) {
  const configRef = useRef({ style, hexColor, overlay, blur, enabled });
  configRef.current = { style, hexColor, overlay, blur, enabled };

  useEffect(() => {
    if (!enabled) return;

    const apply = () => {
      const c = configRef.current;
      if (!c.enabled) return;

      const color = c.hexColor === 'transparent' ? '#000000' : (c.hexColor || '#000000');

      // 1. Update the persistent shield — this NEVER gets cleaned up
      applyShieldColor(color);

      // 2. Update Median native status bar
      applyMedianStatusBar(c.style, c.hexColor, c.overlay, c.blur);

      // 3. Belt + suspenders: paint html/body to match (iOS WebView compositing)
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

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

    // Re-apply on visibility restore (triple-fire for iOS reliability)
    const handleVisibility = () => {
      if (!document.hidden) {
        apply();
        setTimeout(apply, 100);
        setTimeout(apply, 300);
      }
    };

    // Re-apply on focus (Median.co sometimes misses visibilitychange)
    const handleFocus = () => {
      apply();
      setTimeout(apply, 150);
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
  }, [enabled]); // config changes handled via ref — only re-run if enabled toggles
}
