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
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100">
        <SliderPrimitive.Range 
          className={cn(
            "absolute h-full transition-colors",
            isOutstanding 
              ? "bg-gradient-to-r from-[#FFAF30] to-[#F79E1B]" 
              : "bg-gray-300"
          )} 
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isOutstanding 
            ? "bg-[#F79E1B] border-[#F79E1B] focus-visible:ring-[#FFAF30] hover:bg-[#E8890F] hover:border-[#E8890F]" 
            : "bg-gray-400 border-gray-400 focus-visible:ring-gray-400"
        )} 
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
