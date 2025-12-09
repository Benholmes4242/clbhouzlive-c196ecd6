import * as React from "react";
import { cn } from "@/lib/utils";

interface PageRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * PageRoot:
 *  - Applies the iOS compositing fix (.page-root)
 *  - Provides a consistent full-page layout wrapper for standalone pages
 */
export const PageRoot: React.FC<PageRootProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "page-root min-h-[100vh] w-full flex flex-col",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default PageRoot;
