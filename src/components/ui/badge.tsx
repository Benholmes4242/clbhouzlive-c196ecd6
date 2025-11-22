
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-meta font-semibold transition-all duration-motion-fast ease-standard focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-accent text-white hover:brightness-110",
        secondary:
          "border-transparent bg-surface-slate text-white hover:opacity-90",
        destructive:
          "border-transparent bg-destructive text-white hover:brightness-110",
        outline: "border-border text-primary hover:bg-surface-alt",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
