import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "light",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <div
      className={cn(
        "rounded-sq-sm bg-surface-alt",
        variant === "dark" ? "clb-shimmer-dark" : "clb-shimmer-light",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
export type { } // ensure isolatedModules
