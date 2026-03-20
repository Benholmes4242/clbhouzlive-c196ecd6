import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { 'data-tier'?: string }
>(({ className, 'data-tier': dataTier, ...props }, ref) => {
  // All tiers now use amber styling (unified rating system)
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center group",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[6px] w-full grow overflow-hidden rounded-full bg-[#e8eaed] shadow-inner">
        <SliderPrimitive.Range 
          className="absolute h-full transition-all duration-200 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-[22px] w-[22px] rounded-full transition-all duration-150 ease-out",
          "shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400",
          "active:scale-110 hover:scale-105",
          "disabled:pointer-events-none disabled:opacity-50",
          "bg-white border-[2.5px] border-amber-500"
        )}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
