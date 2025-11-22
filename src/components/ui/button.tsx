import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-[color:hsl(var(--input))] bg-[color:var(--surface-input)] text-foreground hover:bg-[color:var(--surface-input-hover)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent text-foreground hover:bg-[color:var(--surface-input)]",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: 
          "bg-gradient-to-b from-white to-gray-100 border border-gray-300 text-gray-800 font-semibold hover:from-gray-50 hover:to-gray-200 active:from-gray-100 active:to-gray-300 transition-all duration-200",
        "gradient-primary": 
          "bg-gradient-to-b from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-800 font-semibold hover:from-emerald-100 hover:to-emerald-200 active:from-emerald-200 active:to-emerald-300 transition-all duration-200",
        chip: 
          "bg-gradient-to-b from-white to-gray-50 border border-gray-200 text-gray-700 font-medium hover:from-gray-50 hover:to-gray-100 active:from-gray-100 active:to-gray-200 transition-all duration-150 rounded-full",
        "chip-active":
          "bg-gradient-to-b from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-700 font-medium hover:from-emerald-100 hover:to-emerald-200 transition-all duration-150 rounded-full",
        glass:
          "rounded-full bg-white/90 backdrop-blur-md border border-black/10 shadow-sm text-gray-900 font-medium hover:bg-white active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/25 disabled:opacity-60 disabled:cursor-not-allowed",
        "glass-outline":
          "rounded-full bg-white/70 backdrop-blur-md border border-black/15 shadow text-gray-900 font-medium hover:bg-white/80 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        chip: "h-8 px-3 py-1.5 text-sm",
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
