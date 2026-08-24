import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-sq-sm border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white/95 placeholder:text-white/40",
          "transition-[background-color,border-color] duration-motion-fast",
          "focus-visible:outline-none focus-visible:border-white/30 focus-visible:bg-white/10",
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
Textarea.displayName = "Textarea"

export { Textarea }
