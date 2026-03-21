import React, { PropsWithChildren, useEffect } from "react";
import { warmHlsJs } from "@/hooks/useHlsUrlCache";
import { initMobileVideoDebug } from "@/media/mobileVideoDebug";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 * Also handles early performance optimizations.
 * 
 * Safe Area Handling:
 * - Uses CSS class .app-shell which applies padding for notch/status bar
 * - Uses 100dvh (dynamic viewport height) for proper mobile sizing
 * - Works with Capacitor/PWA/browser environments
 * 
 * DEBUG PANEL HIDDEN - To re-enable, uncomment the debug panel code below
 * and restore the useState/useEffect hooks for debugLines, isCollapsed, etc.
 */
export default function AppShell({ children }: PropsWithChildren) {
  // Warm hls.js chunk on app start to avoid delay on first video
  useEffect(() => {
    warmHlsJs();
    initMobileVideoDebug();
    // Pre-measure bandwidth before any video loads so the first video
    // starts at full quality — no ramp-up, no soft first frame.
    // Runs in parallel with feed data fetch, adds zero perceived latency.

  }, []);

  // DEBUG PANEL DISABLED - Re-enable when needed
  // See git history or ask to "enable debug panel" to restore

  return (
    <>
      <div className="app-shell">
        {children}
      </div>
      {/* Global A11y live region for screen reader announcements */}
      <div id="a11y-live" className="sr-live" aria-live="polite" aria-atomic="true" />
    </>
  );
}