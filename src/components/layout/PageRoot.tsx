import * as React from "react";
import { cn } from "@/lib/utils";
import { useMedianStatusBar } from "@/hooks/useMedianStatusBar";

interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** When true, skips default status bar styling - allows child components to control it */
  immersiveStatusBar?: boolean;
  /** When true, page is exactly viewport height with no scroll - for fixed layouts like Hub */
  fixedHeight?: boolean;
  /** When true, adds 90px bottom padding to clear the bottom navigation bar */
  hasBottomNav?: boolean;
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
  ({ children, className, immersiveStatusBar = false, fixedHeight = false, hasBottomNav = true, style, ...rest }, ref) => {
    // Default light chrome for all pages (disabled when child controls status bar)
    useMedianStatusBar("light", "#F8FAFC", false, false, !immersiveStatusBar);

    // Build bottom padding: always apply when hasBottomNav, even for fixedHeight
    const bottomPadding = hasBottomNav ? '90px' : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "page-root w-full flex flex-col bg-[var(--bg-page)]",
          !fixedHeight && "min-h-[100vh]",
          fixedHeight && "h-[100dvh] overflow-hidden",
          className
        )}
        // Merge: internal paddingBottom is applied AFTER spread so it can't be overwritten
        style={{ ...style, ...(bottomPadding ? { paddingBottom: bottomPadding } : {}) }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

PageRoot.displayName = "PageRoot";

export default PageRoot;
