import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// DESIGN RULE:
// - `primary`: one hero CTA per screen (main action).
// - `secondary`: default for all other buttons.

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary CTA pill – use for 1 main action per screen
        primary: "rounded-sq-pill border border-slate-300/70 bg-slate-100 text-sm text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.15)] hover:bg-slate-50",
        // Secondary – default for everything else
        secondary: "rounded-sq-sm border border-border/60 bg-card text-sm text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-slate-50",
        // Tertiary - micro buttons for filters, sort controls, small utilities
        tertiary: "rounded-sq-sm border border-border/60 bg-card text-xs font-medium text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-slate-100 active:bg-slate-100 active:scale-[0.98]",
        // Legacy variants - preserved for backward compatibility
        default: "rounded-sq-sm bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        destructive: "rounded-sq-sm bg-red-500 text-white border border-red-500/80 shadow-sm hover:bg-red-600 active:bg-red-700",
        outline: "rounded-sq-sm bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        ghost: "rounded-sq-sm bg-transparent text-slate-600 hover:bg-slate-50",
        link: "text-slate-600 underline-offset-4 hover:underline",
        gradient: "rounded-sq-sm bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        "gradient-primary": "rounded-sq-sm bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        chip: "bg-surface-alt border border-border text-secondary rounded-sq-pill hover:bg-surface-alt/80",
        "chip-active": "bg-surface-slate text-white rounded-sq-pill hover:opacity-90",
        glass: "rounded-sq-md bg-white/90 backdrop-blur-md border border-black/10 shadow-sm text-gray-900 font-medium hover:bg-white hover:scale-[1.02] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed",
        "glass-outline": "rounded-sq-md bg-white/70 backdrop-blur-md border border-black/15 shadow text-gray-900 font-medium hover:bg-white/80 hover:scale-[1.02] active:translate-y-[1px]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
        chip: "h-8 px-3 py-1.5",
        tertiary: "px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full"
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
