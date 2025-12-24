import React, { PropsWithChildren, useEffect } from "react";
import { warmHlsJs } from "@/hooks/useHlsUrlCache";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 * Also handles early performance optimizations.
 */
export default function AppShell({ children }: PropsWithChildren) {
  // Warm hls.js chunk on app start to avoid delay on first video
  useEffect(() => {
    warmHlsJs();
  }, []);

  return (
    <>
      <div className="app-shell">{children}</div>
      {/* Global A11y live region for screen reader announcements */}
      <div id="a11y-live" className="sr-live" aria-live="polite" aria-atomic="true" />
    </>
  );
}