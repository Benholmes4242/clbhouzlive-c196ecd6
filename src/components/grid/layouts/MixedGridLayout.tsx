/**
 * MixedGridLayout - Portrait + Landscape mixed grid
 * 
 * Used for Explore/Discover pages
 * Supports both 3:4 portrait tiles and 16:9 landscape tiles (col-span-2)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_GAP_PX } from '../types';

interface MixedGridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function MixedGridLayout({
  children,
  columns = 2,
  className,
}: MixedGridLayoutProps) {
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

/**
 * Helper to wrap landscape items with col-span-2
 */
interface MixedGridItemProps {
  variant: 'portrait' | 'landscape';
  children: React.ReactNode;
  className?: string;
}

export function MixedGridItem({ variant, children, className }: MixedGridItemProps) {
  const aspectClass = variant === 'landscape' ? 'aspect-video' : 'aspect-[3/4]';
  const spanClass = variant === 'landscape' ? 'col-span-2' : '';
  
  return (
    <div className={cn(aspectClass, spanClass, 'relative overflow-hidden', className)}>
      {children}
    </div>
  );
}
