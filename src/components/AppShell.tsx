import React, { PropsWithChildren, useEffect } from "react";
import { warmHlsJs } from "@/hooks/useHlsUrlCache";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 * Also handles early performance optimizations.
 */
interface AppShellProps extends PropsWithChildren {
  className?: string;
}

export default function AppShell({ children, className }: AppShellProps) {
  // Warm hls.js chunk on app start to avoid delay on first video
  useEffect(() => {
    warmHlsJs();
  }, []);

  return <div className={`app-shell ${className || ''}`}>{children}</div>;
}