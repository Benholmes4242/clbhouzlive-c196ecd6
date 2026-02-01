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

export function useMedianStatusBar(style: "light" | "dark" | "auto", hexColor: string, overlay = false, blur = false) {
  useEffect(() => {
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

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [style, hexColor, overlay, blur]);
}
