import React from 'react';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  outerRef?: (node: HTMLDivElement | null) => void;
  leftPad?: number;
  rightPad?: number;
  className?: string;
}

export function HorizontalCarousel({ 
  children, 
  outerRef, 
  leftPad = 0, 
  rightPad = 0,
  className = ""
}: HorizontalCarouselProps) {
  return (
    <div
      ref={outerRef}
      className={`overflow-x-auto scrollbar-hide no-smooth ${className}`}
      style={{
        // momentum + no snap (defends against any global/parent styles)
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        scrollSnapType: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        // prevents width shift when a scrollbar appears
        scrollbarGutter: 'stable both-edges'
      }}
    >
      <div
        className="flex"
        style={{
          gap: '12px',
          paddingLeft: leftPad,
          paddingRight: rightPad
        }}
      >
        {children}
      </div>
    </div>
  );
}