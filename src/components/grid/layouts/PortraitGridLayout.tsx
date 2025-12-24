/**
 * PortraitGridLayout - 2-3 column portrait grid layout
 * 
 * Used for Watch page, Profile Activity, Business Activity
 * All tiles are 3:4 aspect ratio
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_GAP_PX } from '../types';

interface PortraitGridLayoutProps {
  columns?: number;
  children: React.ReactNode;
  className?: string;
}

export function PortraitGridLayout({
  columns = 2,
  children,
  className,
}: PortraitGridLayoutProps) {
  return (
    <div
      className={cn(
        'grid',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className
      )}
      style={{ gap: `${GRID_GAP_PX}px` }}
    >
      {children}
    </div>
  );
}
