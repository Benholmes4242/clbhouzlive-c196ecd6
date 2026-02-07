/**
 * NineDotsIcon - 3x3 squircle grid icon for Tour Hub navigation
 * Uses rounded rectangles matching the app's squircle design system
 * Center squircle uses the CLBHOUZ brand orange
 */

import React from 'react';

interface NineDotsIconProps {
  className?: string;
  size?: number;
}

// Clbhouz brand orange - matches CLBHOUZ_ORANGE constant
const BRAND_ORANGE = '#F59E0B';

export function NineDotsIcon({ className, size = 20 }: NineDotsIconProps) {
  const squircleSize = 4.2;
  const cornerRadius = 1.4; // ~33% of size for squircle feel
  
  const positions = [
    { x: 2, y: 2 },    // Row 1
    { x: 8, y: 2 },
    { x: 14, y: 2 },
    { x: 2, y: 8 },    // Row 2
    { x: 8, y: 8 },    // Center - orange
    { x: 14, y: 8 },
    { x: 2, y: 14 },   // Row 3
    { x: 8, y: 14 },
    { x: 14, y: 14 },
  ];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 20 20" 
      fill="none" 
      className={className}
    >
      {positions.map((pos, index) => (
        <rect
          key={index}
          x={pos.x}
          y={pos.y}
          width={squircleSize}
          height={squircleSize}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={index === 4 ? BRAND_ORANGE : 'currentColor'}
        />
      ))}
    </svg>
  );
}
