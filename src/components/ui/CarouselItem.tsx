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
      className={className}
      style={{
        // flex: 0 0 auto guarantees no shrinking/growing during swipe
        flex: '0 0 auto',
        width,
        scrollSnapAlign: 'unset'
      }}
    >
      {children}
    </div>
  );
}