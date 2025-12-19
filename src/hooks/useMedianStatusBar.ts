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
    try {
      // Primary Median bridge
      if (window.Median?.statusBar) {
        window.Median.statusBar.setStyle(style);
        window.Median.statusBar.setBackgroundColor(backgroundColor);
        return;
      }

      // WKWebView fallback
      if (window.webkit?.messageHandlers?.median) {
        window.webkit.messageHandlers.median.postMessage({
          type: "statusBar",
          style,
          backgroundColor,
        });
      }
    } catch (e) {
      // Fail silently (web preview will ignore this)
    }
  }, [style, backgroundColor]);
}
