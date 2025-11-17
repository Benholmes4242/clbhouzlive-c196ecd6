
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
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          "bg-[color:var(--surface-input)] border-[color:hsl(var(--input))] text-foreground",
          "placeholder:text-[color:var(--placeholder-foreground)]",
          "hover:bg-[color:var(--surface-input-hover)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:hsl(var(--input-focus))]",
          "focus-visible:border-[color:hsl(var(--input-focus))]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-50",
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
