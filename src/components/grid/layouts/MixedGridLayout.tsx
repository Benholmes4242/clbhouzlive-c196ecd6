/**
 * MixedGridLayout - Portrait + Landscape mixed grid
 * 
 * Used for Watch/Shorts tab with mixed aspect ratio tiles
 * Pattern: Every 5th item is a landscape full-width tile (col-span-2)
 * Autoplay: Only landscape tiles autoplay
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_GAP_PX } from '../types';

interface MixedGridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
  /** Position pattern for landscape tiles - every Nth tile is landscape (default: 5) */
  landscapeEveryNth?: number;
}

export function MixedGridLayout({
  children,
  columns = 2,
  className,
  landscapeEveryNth = 5,
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
 * Helper to wrap items with correct aspect ratio and span
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

/**
 * Utility to determine if a position should be landscape
 * Every Nth item (positions 5, 10, 15... i.e., index+1 divisible by N)
 */
export function isLandscapePosition(index: number, everyNth: number = 5): boolean {
  return (index + 1) % everyNth === 0;
}

/**
 * Utility to format engagement counts (1K, 1.5M, etc)
 */
export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
