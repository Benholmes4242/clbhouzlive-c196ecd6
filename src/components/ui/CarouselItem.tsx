import React from 'react';

interface CarouselItemProps {
  width: string;
  children: React.ReactNode;
  keyProp?: string | number;
  className?: string;
}

export function CarouselItem({ 
  width, 
  children, 
  keyProp, 
  className = "" 
}: CarouselItemProps) {
  return (
    <div
      key={keyProp}
      className={`flex-shrink-0 ${className}`}
      style={{
        width,             // e.g., getCardWidth()
        scrollSnapAlign: 'unset'
      }}
    >
      {children}
    </div>
  );
}