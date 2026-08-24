
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sq-sm border border-white/10 px-4 py-3 text-body-md",
          "bg-white/[0.06] text-white/95",
          "placeholder:text-white/40",
          "transition-[background-color,border-color] duration-motion-fast",
          "focus-visible:outline-none focus-visible:border-white/30 focus-visible:bg-white/10",
          "file:border-0 file:bg-transparent file:text-body-md file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        style={{ WebkitAppearance: 'none' }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
