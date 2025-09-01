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
      className={`overflow-x-auto scrollbar-hide ${className}`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',   // iOS momentum
        overscrollBehaviorX: 'contain',     // keep gestures contained
        scrollSnapType: 'none'              // defend against global snap bleed
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