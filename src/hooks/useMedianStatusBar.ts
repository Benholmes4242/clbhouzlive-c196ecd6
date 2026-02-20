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

    const applyStatusBar = () => {
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
        // fail silently
      }
    };

    // 1) Apply immediately
    applyStatusBar();

    // 2) Register Median's ready callback (bridge loads async)
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      if (typeof prev === "function") prev();
      applyStatusBar();
    };

    // 3) Failsafe retries for SPA navigation
    const t1 = window.setTimeout(applyStatusBar, 250);
    const t2 = window.setTimeout(applyStatusBar, 750);
    const t3 = window.setTimeout(applyStatusBar, 1500);

    // FIX 1: Dual-fire on resume — t=0 (instant) + t=100ms + t=300ms retries
    // FIX 5: Listen to both visibilitychange AND focus for broader iOS WebView coverage
    const reapplyOnResume = () => {
      if (!enabled) return;

      // Fire immediately — catches cases where bridge is ready
      applyStatusBar();

      // Fire again after 100ms — catches cases where bridge needs time to reinitialize
      window.setTimeout(applyStatusBar, 100);

      // Fire once more after 300ms — belt and suspenders for slow resume
      window.setTimeout(applyStatusBar, 300);
    };

    document.addEventListener('visibilitychange', reapplyOnResume);
    window.addEventListener('focus', reapplyOnResume);

    // FIX 3: For immersive/overlay pages, set html + body to black to prevent
    // grey (#F8FAFC) bleeding through the iOS compositing gap on resume
    if (overlay) {
      document.documentElement.style.backgroundColor = '#000000';
      document.body.style.backgroundColor = '#000000';
    }

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

      // Restore default theme-color on unmount
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#F8FAFC');
      }
    };
  }, [style, hexColor, overlay, blur, enabled]);
}
