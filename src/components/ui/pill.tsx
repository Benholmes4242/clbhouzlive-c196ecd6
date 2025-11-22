/**
 * Pill Component - Phase 7 Global Standard
 * 
 * Universal pill/chip component for filters, tags, and selectable items.
 * Uses global design tokens exclusively.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border transition-all duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-surface-alt border-border text-secondary hover:bg-surface-alt/80 hover:border-border",
        active: "bg-surface-slate border-transparent text-white hover:opacity-90",
        outline: "bg-transparent border-border text-primary hover:bg-surface-alt",
      },
      size: {
        default: "px-3 py-1.5 text-body-sm",
        sm: "px-2.5 py-1 text-meta",
        lg: "px-4 py-2 text-body-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillVariants> {
  active?: boolean
}

const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  ({ className, variant, size, active, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          pillVariants({ 
            variant: active ? "active" : variant, 
            size, 
            className 
          })
        )}
        aria-pressed={active}
        {...props}
      />
    )
  }
)
Pill.displayName = "Pill"

export { Pill, pillVariants }
