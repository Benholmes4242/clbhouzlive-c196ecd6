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
        "relative flex w-full touch-none select-none items-center group",
        className
      )}
      {...props}
    >
      {/* Apple-style track: taller for better touch target, refined colors */}
      <SliderPrimitive.Track className="relative h-[6px] w-full grow overflow-hidden rounded-full bg-[#e8eaed] shadow-inner">
        <SliderPrimitive.Range 
          className={cn(
            "absolute h-full transition-all duration-200",
            isOutstanding 
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" 
              : "bg-gradient-to-r from-[#bfc3c9] to-[#a1a6ad]"
          )}
        />
      </SliderPrimitive.Track>
      {/* Apple-style thumb: clean white with shadow, subtle scale on hover/active */}
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-[22px] w-[22px] rounded-full transition-all duration-150 ease-out",
          "shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "active:scale-110 hover:scale-105",
          "disabled:pointer-events-none disabled:opacity-50",
          isOutstanding 
            ? "bg-white border-[2.5px] border-amber-500 focus-visible:ring-amber-400" 
            : "bg-white border-[2.5px] border-[#c4c8ce] focus-visible:ring-[#9ca3af]"
        )}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
