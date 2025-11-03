/**
 * Chip Component
 * Small status chip for tiles
 */

import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  className?: string;
}

export function Chip({ children, className = '' }: ChipProps) {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-[12px] border border-white/14 bg-white/06 text-white/85 ${className}`}
    >
      {children}
    </span>
  );
}
