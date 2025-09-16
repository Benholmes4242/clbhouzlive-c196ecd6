import React from "react";

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
}

export default function CarouselDots({ count, activeIndex }: CarouselDotsProps) {
  if (count <= 1) return null;
  
  return (
    <div className="flex justify-center mt-2 space-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i === activeIndex ? "bg-white" : "bg-white/50"
          }`}
          aria-current={i === activeIndex}
        />
      ))}
    </div>
  );
}