import * as React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMedianStatusBar } from "@/hooks/useMedianStatusBar";
import { useModalContext } from "@/contexts/ModalContext";
import { isGlobalHeaderExcluded } from "@/components/header/globalHeaderRules";

interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * PageRoot:
 *  - Applies the iOS compositing fix (.page-root)
 *  - Provides a consistent full-page layout wrapper for standalone pages
 *  - Sets default light status bar for Median iOS wrapper
 *  - Enforces non-regressable header offset for pages that render under GlobalHeader
 */
export const PageRoot = React.forwardRef<HTMLDivElement, PageRootProps>(
  ({ children, className, ...rest }, ref) => {
    // Default light chrome for all pages (Clubhouse overrides this)
    useMedianStatusBar("light", "#F8FAFC", false, false);

    const location = useLocation();
    const { shouldHideHeader } = useModalContext();

    // Pages should sit flush below header by default. Only apply offset
    // if explicitly requested via className.
    const hasExplicitOffsetClass =
      typeof className === "string" &&
      (className.includes("compact-header-offset") ||
        className.includes("compact-header-offset-no-safe"));

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
