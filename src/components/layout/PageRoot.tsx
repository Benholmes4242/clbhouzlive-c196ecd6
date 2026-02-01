import * as React from "react";
import { cn } from "@/lib/utils";
import { useMedianStatusBar } from "@/hooks/useMedianStatusBar";

interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** When true, skips default status bar styling - allows child components to control it */
  immersiveStatusBar?: boolean;
}

/**
 * PageRoot:
 *  - Applies the iOS compositing fix (.page-root)
 *  - Provides a consistent full-page layout wrapper for standalone pages
 *  - Sets default light status bar for Median iOS wrapper (unless immersiveStatusBar is true)
 *  - Enforces non-regressable header offset for pages that render under GlobalHeader
 */
export const PageRoot = React.forwardRef<HTMLDivElement, PageRootProps>(
  ({ children, className, immersiveStatusBar = false, ...rest }, ref) => {
    // Default light chrome for all pages (disabled when child controls status bar)
    useMedianStatusBar("light", "#F8FAFC", false, false, !immersiveStatusBar);

    return (
      <div
        ref={ref}
        className={cn(
          "page-root min-h-[100vh] w-full flex flex-col bg-[var(--bg-page)]",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

PageRoot.displayName = "PageRoot";

export default PageRoot;
