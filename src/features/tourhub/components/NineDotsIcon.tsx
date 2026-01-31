/**
 * NineDotsIcon - 3x3 squircle grid icon for Tour Hub navigation
 * Uses squircle shapes matching the app's design system
 * Center squircle uses the outstanding orange color
 */

import React from 'react';

interface NineDotsIconProps {
  className?: string;
  size?: number;
}

export function NineDotsIcon({ className, size = 20 }: NineDotsIconProps) {
  // Squircle path with 34% border-radius feel
  // Each squircle is 4x4 units with rounded corners
  const squirclePath = (cx: number, cy: number) => {
    const s = 1.6; // half-size of each squircle
    const r = 0.6; // corner radius for squircle effect
    return `M${cx - s + r},${cy - s} 
            h${(s - r) * 2} 
            q${r},0 ${r},${r} 
            v${(s - r) * 2} 
            q0,${r} -${r},${r} 
            h-${(s - r) * 2} 
            q-${r},0 -${r},-${r} 
            v-${(s - r) * 2} 
            q0,-${r} ${r},-${r}z`;
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 20 20" 
      fill="none" 
      className={className}
    >
      {/* Row 1 */}
      <path d={squirclePath(4, 4)} fill="currentColor" />
      <path d={squirclePath(10, 4)} fill="currentColor" />
      <path d={squirclePath(16, 4)} fill="currentColor" />
      
      {/* Row 2 - center one is outstanding orange */}
      <path d={squirclePath(4, 10)} fill="currentColor" />
      <path d={squirclePath(10, 10)} fill="#F79E1B" />
      <path d={squirclePath(16, 10)} fill="currentColor" />
      
      {/* Row 3 */}
      <path d={squirclePath(4, 16)} fill="currentColor" />
      <path d={squirclePath(10, 16)} fill="currentColor" />
      <path d={squirclePath(16, 16)} fill="currentColor" />
    </svg>
  );
}
