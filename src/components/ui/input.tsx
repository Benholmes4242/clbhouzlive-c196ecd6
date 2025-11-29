
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
          "flex h-10 w-full rounded-xl border border-slate-200 px-4 py-3 text-body-md",
          "bg-white text-slate-800",
          "placeholder:text-slate-400",
          "focus-visible:outline-none focus-visible:border-slate-600",
          "file:border-0 file:bg-transparent file:text-body-md file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50",
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
