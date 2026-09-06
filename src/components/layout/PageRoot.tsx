import * as React from "react";
import { useRef } from "react";

import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
// useMedianStatusBar removed — chrome is owned solely by AppRoutes now.
import { isDarkChromeRoute } from "@/components/header/globalHeaderRules";
import { usePageRootMount } from "@/perf/usePageReady";

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
    // Capture mount-time pathname once. Keep-alive pages (e.g. Clubhouse)
    // stay mounted while the user navigates elsewhere; ownerPath ensures the
    // stale hook does not re-assert chrome on unrelated routes.
    const ownerPathRef = useRef(location.pathname);

    // Chrome writers (shield / html-body bg / native status bar) are owned
    // solely by AppRoutes now. PageRoot no longer races them per mount.
    // Retained: ownerPathRef (used elsewhere) and dark/light class application
    // via className. Route-derived status-bar values are computed in AppRoutes
    // via isDarkChromeRoute / isImmersiveRoute — no per-page override needed.
    void immersiveStatusBar;
    void ownerPathRef;



    usePageRootMount();



    // Labelled bottom nav (~60px) + 20px float gap + 16px breathing room.
    const bottomPadding = hasBottomNav ? 'var(--bottom-nav-height, 96px)' : undefined;

    // Option B: .app-shell padding-top is zeroed via CSS on immersive routes
    // (html[data-immersive-route='true']), so the hero already sits at physical
    // y=0. No negative marginTop needed — that pull-up raced the native
    // overlay:true bridge call and collapsed to 0 when --sat wasn't ready,
    // pushing the image below the notch.
    const immersiveMargin = undefined;

    return (
      <div
        ref={ref}
        className={cn(
          `page-root w-full max-w-[480px] md:max-w-[620px] mx-auto flex flex-col ${immersiveStatusBar ? 'bg-[#0F172A]' : 'bg-[var(--bg-page)]'}`,
          dark === true && 'hcp-dark',
          dark === false && 'hcp-light',
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
