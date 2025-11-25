import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-slate-600 bg-slate-900/5 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-600 focus-visible:border-slate-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
