import React, { PropsWithChildren } from "react";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 */
export default function AppShell({ children }: PropsWithChildren) {
  return <div className="app-shell">{children}</div>;
}