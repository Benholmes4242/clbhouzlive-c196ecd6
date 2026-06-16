import * as React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMedianStatusBar } from "@/hooks/useMedianStatusBar";

/**
 * Routes that keep the dark chrome (notch/status bar stays dark).
 * Only Clubhouse feed and Handicap stay dark; every other route is light.
 */
function isDarkChromeRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/clubhouse') return true;
  if (pathname === '/handicap' || pathname.startsWith('/handicap/')) return true;
  return false;
}

interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** When true, skips default status bar styling - allows child components to control it */
  immersiveStatusBar?: boolean;
  /** When true, page is exactly viewport height with no scroll - for fixed layouts like Hub */
  fixedHeight?: boolean;
  /** When true, adds 90px bottom padding to clear the bottom navigation bar */
  hasBottomNav?: boolean;
  /** When true, pulls the page up into .app-shell's safe-area padding so hero images can bleed to viewport top */
  immersive?: boolean;
  /** When true, applies the handicap dark "performance terminal" palette (.hcp-dark) and dark status bar. */
  dark?: boolean;
}

/**
 * PageRoot:
 *  - Applies the iOS compositing fix (.page-root)
 *  - Provides a consistent full-page layout wrapper for standalone pages
 *  - Sets default light status bar for Median iOS wrapper (unless immersiveStatusBar is true)
 *  - Enforces non-regressable header offset for pages that render under GlobalHeader
 *  - Supports fixedHeight mode for pages that should not scroll (like Hub)
 */
export const PageRoot = React.forwardRef<HTMLDivElement, PageRootProps>(
  ({ children, className, immersiveStatusBar = false, fixedHeight = false, hasBottomNav = true, immersive = false, dark, style, ...rest }, ref) => {
    // Route-aware default: every page except Clubhouse and Profile inherits
    // the dark handicap chrome (notch + status bar + canvas).
    const location = useLocation();
    const resolvedDark = dark ?? isDarkChromeRoute(location.pathname);

    // Default light chrome for the Clubhouse/Profile pages; dark elsewhere.
    useMedianStatusBar(
      resolvedDark ? "dark" : "light",
      resolvedDark ? "#0A0E14" : "#F8FAFC",
      false,
      false,
      !immersiveStatusBar,
      resolvedDark ? "dark" : "light",
    );

    // Bottom nav (64px) + safe area spacer (30px) = 94px clearance
    const bottomPadding = hasBottomNav ? '94px' : undefined;

    // Immersive pages pull themselves up into .app-shell's padding-top so heroes can bleed to viewport top
    const immersiveMargin = immersive
      ? 'calc(-1 * var(--sat))'
      : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          `page-root w-full max-w-[480px] md:max-w-none mx-auto flex flex-col ${immersiveStatusBar ? 'bg-black' : 'bg-[var(--bg-page)]'}`,
          dark === true && 'hcp-dark',
          !fixedHeight && "min-h-[100vh]",
          fixedHeight && "h-[100dvh] overflow-hidden",
          className
        )}
        style={{
          ...style,
          ...(bottomPadding ? { paddingBottom: bottomPadding } : {}),
          ...(immersiveMargin ? { marginTop: immersiveMargin } : {}),
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

PageRoot.displayName = "PageRoot";

export default PageRoot;
