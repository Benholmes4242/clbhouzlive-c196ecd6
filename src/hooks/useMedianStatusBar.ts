import { useEffect } from "react";

declare global {
  interface Window {
    median?: any;
    median_library_ready?: () => void;
  }
}

// FIX 4: Handle 8-char hex, fallback to opaque black (not white)
function toAARRGGBB(hex: string) {
  if (hex.toLowerCase() === "transparent") return "00000000";
  const clean = hex.replace("#", "").trim();
  if (clean.length === 8) {
    // Already AARRGGBB format — pass through
    return clean.toUpperCase();
  }
  if (clean.length !== 6) return "FF000000"; // fallback to opaque black
  return `FF${clean.toUpperCase()}`;
}

export function useMedianStatusBar(
  style: "light" | "dark" | "auto", 
  hexColor: string, 
  overlay = false, 
  blur = false,
  enabled = true  // When false, hook does nothing - lets underlying page control status bar
) {
  useEffect(() => {
    if (!enabled) return;
    if (!navigator.userAgent.toLowerCase().includes("median")) return;

    const applyAll = () => {
      try {
        if (window.median?.statusbar?.set) {
          window.median.statusbar.set({
            style,
            color: toAARRGGBB(hexColor),
            overlay,
            blur,
          });
        }
        // Force black on all layers for immersive pages
        if (overlay) {
          document.documentElement.style.backgroundColor = '#000000';
          document.body.style.backgroundColor = '#000000';
          const appShell = document.querySelector('.app-shell') as HTMLElement;
          if (appShell) appShell.style.backgroundColor = '#000000';
        }
      } catch {
        // fail silently
      }
    };

    // 1) Apply immediately
    applyAll();

    // 2) Register Median's ready callback (bridge loads async)
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      if (typeof prev === "function") prev();
      applyAll();
    };

    // 3) Failsafe retries for SPA navigation
    const t1 = window.setTimeout(applyAll, 250);
    const t2 = window.setTimeout(applyAll, 750);
    const t3 = window.setTimeout(applyAll, 1500);

    // FIX 1: Dual-fire on resume — t=0 (instant) + t=100ms + t=300ms retries
    // FIX 5: Listen to both visibilitychange AND focus for broader iOS WebView coverage
    const reapplyOnResume = () => {
      if (!enabled) return;
      applyAll();
      window.setTimeout(applyAll, 100);
      window.setTimeout(applyAll, 300);
    };

    document.addEventListener('visibilitychange', reapplyOnResume);
    window.addEventListener('focus', reapplyOnResume);

    // 5) Update theme-color meta tag to match status bar for iOS compositing
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (hexColor === 'transparent' || hexColor === '#00000000') {
        metaThemeColor.setAttribute('content', '#000000');
      } else {
        metaThemeColor.setAttribute('content', hexColor || '#F8FAFC');
      }
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      document.removeEventListener('visibilitychange', reapplyOnResume);
      window.removeEventListener('focus', reapplyOnResume);

      // Restore default backgrounds
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      const appShell = document.querySelector('.app-shell') as HTMLElement;
      if (appShell) appShell.style.backgroundColor = '';

      // Restore default theme-color on unmount
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#F8FAFC');
      }
    };
  }, [style, hexColor, overlay, blur, enabled]);
}
