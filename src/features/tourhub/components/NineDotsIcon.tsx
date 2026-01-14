/**
 * NineDotsIcon - 3x3 dot grid icon (LIV-style)
 */

import React from 'react';

interface NineDotsIconProps {
  className?: string;
  size?: number;
}

export function NineDotsIcon({ className, size = 20 }: NineDotsIconProps) {
  const dotSize = size / 6;
  const gap = size / 4;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 20 20" 
      fill="none" 
      className={className}
    >
      {/* Row 1 */}
      <circle cx="4" cy="4" r="1.8" fill="currentColor" />
      <circle cx="10" cy="4" r="1.8" fill="currentColor" />
      <circle cx="16" cy="4" r="1.8" fill="currentColor" />
      
      {/* Row 2 */}
      <circle cx="4" cy="10" r="1.8" fill="currentColor" />
      <circle cx="10" cy="10" r="1.8" fill="#F79E1B" />
      <circle cx="16" cy="10" r="1.8" fill="currentColor" />
      
      {/* Row 3 */}
      <circle cx="4" cy="16" r="1.8" fill="currentColor" />
      <circle cx="10" cy="16" r="1.8" fill="currentColor" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}
