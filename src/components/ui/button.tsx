import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-md font-medium ring-offset-background transition-transform duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-accent text-white hover:brightness-110 hover:shadow-md active:shadow-sm",
        destructive:
          "bg-destructive text-white hover:brightness-110 hover:shadow-md active:shadow-sm",
        outline:
          "border border-slate-400 bg-surface-alt text-[color:var(--cta-text-color)] hover:bg-surface-alt/80 hover:border-slate-500",
        secondary:
          "bg-surface-slate text-white hover:opacity-90 hover:shadow-md active:shadow-sm",
        ghost: "bg-transparent text-[color:var(--cta-text-color)] hover:bg-surface-alt",
        link: "text-primary underline-offset-4 hover:underline",
        // Legacy variants - to be migrated to Pill component
        gradient: "bg-surface-card border border-border text-primary hover:bg-surface-alt",
        "gradient-primary": "bg-primary-accent text-white hover:brightness-110",
        chip: "bg-surface-alt border border-border text-secondary rounded-full hover:bg-surface-alt/80",
        "chip-active": "bg-surface-slate text-white rounded-full hover:opacity-90",
        // Glass variants for Hub/Clubhouse
        glass:
          "rounded-full bg-white/90 backdrop-blur-md border border-black/10 shadow-sm text-gray-900 font-medium hover:bg-white hover:scale-[1.02] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed",
        "glass-outline":
          "rounded-full bg-white/70 backdrop-blur-md border border-black/15 shadow text-gray-900 font-medium hover:bg-white/80 hover:scale-[1.02] active:translate-y-[1px]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        chip: "h-8 px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
