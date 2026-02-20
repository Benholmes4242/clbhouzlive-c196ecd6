import { useEffect } from "react";

declare global {
  interface Window {
    median?: any;
    median_library_ready?: () => void;
  }
}

function toAARRGGBB(hex: string) {
  // Handle transparent specially
  if (hex.toLowerCase() === "transparent") {
    return "00000000"; // Fully transparent AARRGGBB
  }
  // Input: "#F8FAFC" or "F8FAFC"
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return "FFFFFFFF"; // fallback white
  // Median expects AARRGGBB, e.g. "FFF8FAFC"
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
    // EXIT EARLY if not enabled - don't touch status bar at all
    if (!enabled) return;
    
    // Only attempt in Median app runtime
    if (!navigator.userAgent.toLowerCase().includes("median")) return;

    const apply = () => {
      try {
        if (window.median?.statusbar?.set) {
          window.median.statusbar.set({
            style,                 // 'light' = black icons, 'dark' = white icons, 'auto' = follows device
            color: toAARRGGBB(hexColor),
            overlay,
            blur,
          });
        }
      } catch {
        // fail silently
      }
    };

    // 1) Try immediately (sometimes bridge is already ready)
    apply();

    // 2) Also register Median's ready callback (bridge loads async)
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      if (typeof prev === "function") prev();
      apply();
    };

    // 3) Failsafe: retry a few times in case ready callback doesn't fire for SPA navigation
    const t1 = window.setTimeout(apply, 250);
    const t2 = window.setTimeout(apply, 750);
    const t3 = window.setTimeout(apply, 1500);

    // 4) Re-apply on app resume — Median bridge resets status bar when backgrounded
    const reapplyOnResume = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
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
            // Silent catch — bridge may not be ready
          }
        }, 50);
      }
    };

    document.addEventListener('visibilitychange', reapplyOnResume);

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

      // Restore default theme-color on unmount
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', '#F8FAFC');
      }
    };
  }, [style, hexColor, overlay, blur, enabled]);
}
