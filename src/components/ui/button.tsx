import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-body-md font-medium transition-colors duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        destructive:
          "bg-red-500 text-white border border-red-500/80 shadow-sm hover:bg-red-600 active:bg-red-700",
        outline:
          "bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        secondary:
          "bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-50",
        link: "text-slate-600 underline-offset-4 hover:underline",
        // Legacy variants - to be migrated to Pill component
        gradient: "bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        "gradient-primary": "bg-white border border-slate-600 text-slate-600 hover:bg-slate-50 active:bg-slate-100",
        chip: "bg-surface-alt border border-border text-secondary rounded-full hover:bg-surface-alt/80",
        "chip-active": "bg-surface-slate text-white rounded-full hover:opacity-90",
        // Glass variants for Hub/Clubhouse
        glass:
          "rounded-lg bg-white/90 backdrop-blur-md border border-black/10 shadow-sm text-gray-900 font-medium hover:bg-white hover:scale-[1.02] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed",
        "glass-outline":
          "rounded-lg bg-white/70 backdrop-blur-md border border-black/15 shadow text-gray-900 font-medium hover:bg-white/80 hover:scale-[1.02] active:translate-y-[1px]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
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
