import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { 'data-tier'?: string }
>(({ className, 'data-tier': dataTier, ...props }, ref) => {
  // Check if this slider is in "outstanding" tier (9.0+)
  const isOutstanding = dataTier === 'outstanding';
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#e5e7eb]">
        <SliderPrimitive.Range 
          className={cn(
            "absolute h-full transition-colors",
            isOutstanding 
              ? "bg-gradient-to-r from-amber-400 to-amber-500" 
              : "bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isOutstanding 
            ? "bg-amber-500 border-amber-500 focus-visible:ring-amber-400 hover:bg-amber-600 hover:border-amber-600" 
            : "bg-[#9ca3af] border-[#9ca3af] focus-visible:ring-[#9ca3af] hover:bg-[#6b7280] hover:border-[#6b7280]"
        )}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
