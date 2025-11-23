
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
          "flex h-10 w-full rounded-lg border px-4 py-3 text-body-md",
          "bg-surface-alt border-border text-foreground",
          "placeholder:text-tertiary",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-accent",
          "focus-visible:border-primary-accent",
          "file:border-0 file:bg-transparent file:text-body-md file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
