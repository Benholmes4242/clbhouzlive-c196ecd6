import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-body-md shadow-sm",
          "bg-[color:var(--surface-input)] border-[color:hsl(var(--input))] text-foreground",
          "placeholder:text-[color:var(--placeholder-foreground)]",
          "hover:bg-[color:var(--surface-input-hover)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:hsl(var(--input-focus))]",
          "focus-visible:border-[color:hsl(var(--input-focus))]",
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
