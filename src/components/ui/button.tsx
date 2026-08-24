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
        // —— PINPOINT SYSTEM ——
        'orange':          'font-bold text-white border-none active:scale-[0.97]',
        'dark':            'font-bold text-white border-none active:scale-[0.97]',
        'outline':         'font-semibold bg-transparent border border-border/10 text-foreground active:scale-[0.97]',
        'outlineOrange':   'font-semibold bg-transparent text-[#F7931E] active:scale-[0.97]',
        'muted':           'font-semibold bg-muted text-foreground border-none active:scale-[0.97]',
        'ghost':           'bg-transparent text-muted-foreground border-none active:scale-[0.97]',
        // —— LEGACY ALIASES (unchanged behaviour) ——
        primary:           'font-bold text-white border-none active:scale-[0.97]',
        secondary:         'font-semibold bg-transparent border border-border/10 text-foreground active:scale-[0.97]',
        default:           'font-semibold bg-transparent border border-border/10 text-foreground',
        destructive:       'bg-red-500 text-white border border-red-500/80 shadow-sm',
        link:              'text-foreground underline-offset-4 hover:underline',
        chip:              'bg-muted border border-border/10 text-muted-foreground',
        'chip-active':     'bg-foreground text-white',
        glass:             'bg-white/90 backdrop-blur-md border border-black/10 shadow-sm text-gray-900 font-medium',
        'glass-outline':   'bg-white/70 backdrop-blur-md border border-black/15 shadow text-gray-900 font-medium',
        gradient:          'font-bold text-white border-none',
        'gradient-primary': 'font-bold text-white border-none',
        tertiary:          'border border-border/[0.06] bg-card text-foreground shadow-sm',
      },
      size: {
        default: 'h-11 px-5 py-2.5 rounded-[10px]',
        sm:      'h-9 px-3 rounded-[10px]',
        lg:      'h-12 px-6 rounded-[10px]',
        icon:    'h-10 w-10 rounded-[10px]',
        chip:    'h-8 px-3 py-1.5 rounded-[8px]',
        tertiary: 'px-3 py-1.5 rounded-[8px]',
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
  ({ className, variant, size, fullWidth = false, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Compute inline styles for gradient/dark/outlineOrange variants
    const gradientStyle =
      (variant === 'orange' || variant === 'primary' || variant === 'gradient' || variant === 'gradient-primary')
        ? { background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
            boxShadow: '0 4px 16px rgba(247,147,30,0.28)' }
      : variant === 'dark'
        ? { background: 'hsl(var(--foreground))',
            boxShadow: '0 2px 10px rgba(0,0,0,0.22)' }
      : variant === 'outlineOrange'
        ? { border: '1.5px solid #F59E0B' }
      : {};

    return (
      <Comp
        style={{ ...gradientStyle, ...style }}
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
