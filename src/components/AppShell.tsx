import React, { PropsWithChildren } from "react";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 *
 * [VIDEO-TEARDOWN] initMobileVideoDebug + VideoDebugPanel removed — engine severed.
 */
export default function AppShell({ children }: PropsWithChildren) {
  return (
    <>
      <div className="app-shell">{children}</div>
      {/* Global A11y live region for screen reader announcements */}
      <div
        id="a11y-live"
        className="sr-live"
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  );
}
