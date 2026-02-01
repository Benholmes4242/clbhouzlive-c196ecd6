import { useEffect, useRef } from "react";

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
  const hasApplied = useRef(false);
  
  useEffect(() => {
    // Reset on dependency change
    hasApplied.current = false;
    
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
          hasApplied.current = true;
          return true;
        }
      } catch {
        // fail silently
      }
      return false;
    };

    // 1) Try immediately (sometimes bridge is already ready)
    if (apply()) return;

    // 2) Register Median's ready callback (bridge loads async)
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      if (typeof prev === "function") prev();
      if (!hasApplied.current) apply();
    };

    // 3) Listen for median:ready event (some versions dispatch this)
    const handleMedianReady = () => {
      if (!hasApplied.current) apply();
    };
    window.addEventListener('median:ready', handleMedianReady);
    document.addEventListener('median:ready', handleMedianReady);

    // 4) Retry with increasing delays to catch bridge initialization
    const retryDelays = [50, 100, 200, 350, 500, 750, 1000, 1500];
    const timeouts = retryDelays.map((delay) =>
      window.setTimeout(() => {
        if (!hasApplied.current) apply();
      }, delay)
    );

    // 5) Also try on document load complete
    const handleLoad = () => {
      if (!hasApplied.current) {
        window.setTimeout(apply, 100);
      }
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      timeouts.forEach(window.clearTimeout);
      window.removeEventListener('median:ready', handleMedianReady);
      document.removeEventListener('median:ready', handleMedianReady);
      window.removeEventListener('load', handleLoad);
    };
  }, [style, hexColor, overlay, blur]);
}
