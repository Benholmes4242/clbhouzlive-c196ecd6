import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-sq-sm bg-surface-alt", className)}
      {...props}
    />
  )
}

export { Skeleton }
