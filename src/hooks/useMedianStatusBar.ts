import { useEffect } from "react";

declare global {
  interface Window {
    Median?: any;
    webkit?: any;
  }
}

type StatusBarStyle = "light" | "dark";

/**
 * Controls iOS status bar via Median JS Bridge.
 * - "light" = white status bar icons (for dark backgrounds)
 * - "dark" = dark status bar icons (for light backgrounds)
 */
export function useMedianStatusBar(
  style: StatusBarStyle,
  backgroundColor: string
) {
  useEffect(() => {
    // TEMPORARY DEBUG - Remove after testing in TestFlight
    console.log("[MedianDebug] Checking bridge availability...");
    console.log("[MedianDebug] window.Median:", window.Median);
    console.log("[MedianDebug] webkit messageHandlers:", window.webkit?.messageHandlers);
    
    if (window.webkit?.messageHandlers) {
      console.log("[MedianDebug] Handler keys:", Object.keys(window.webkit.messageHandlers));
    }
    // END TEMPORARY DEBUG

    try {
      // Primary Median bridge
      if (window.Median?.statusBar) {
        console.log("[MedianDebug] Using window.Median.statusBar");
        window.Median.statusBar.setStyle(style);
        window.Median.statusBar.setBackgroundColor(backgroundColor);
        return;
      }

      // WKWebView fallback
      if (window.webkit?.messageHandlers?.median) {
        console.log("[MedianDebug] Using webkit messageHandler fallback");
        window.webkit.messageHandlers.median.postMessage({
          type: "statusBar",
          style,
          backgroundColor,
        });
      }
    } catch (e) {
      console.log("[MedianDebug] Error:", e);
      // Fail silently (web preview will ignore this)
    }
  }, [style, backgroundColor]);
}
