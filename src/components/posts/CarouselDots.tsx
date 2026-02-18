import React from "react";
import { haptic } from "@/utils/haptics";

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
}

export default function CarouselDots({ count, activeIndex, onDotClick }: CarouselDotsProps) {
  if (count <= 1) return null;
  
  return (
    <div 
      className="flex justify-center mt-2 space-x-2 pb-[calc(env(safe-area-inset-bottom,0px))]"
      role="tablist"
      aria-label="Media carousel navigation"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => {
            onDotClick?.(i);
            haptic('light');
          }}
          className={`h-2 w-2 rounded-full transition-colors ${
            i === activeIndex ? "bg-white" : "bg-white/40"
          } ${onDotClick ? 'hover:bg-white/70 cursor-pointer' : 'cursor-default'}`}
          role="tab"
          aria-selected={i === activeIndex}
          aria-label={`Go to media ${i + 1}`}
          disabled={!onDotClick}
        />
      ))}
    </div>
  );
}