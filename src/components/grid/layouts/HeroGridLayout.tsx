/**
 * HeroGridLayout - Hero video + grid below
 * 
 * Used for Trending, Discover pages with featured content
 * Hero takes 16:9 full-width at top, grid below
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { GRID_GAP_PX } from '../types';

interface HeroGridLayoutProps {
  hero: React.ReactNode;
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function HeroGridLayout({
  hero,
  children,
  columns = 2,
  className,
}: HeroGridLayoutProps) {
  return (
    <div className={cn('flex flex-col', className)} style={{ gap: `${GRID_GAP_PX * 2}px` }}>
      {/* Hero section - full width 16:9 */}
      <div className="w-full aspect-video relative overflow-hidden rounded-lg">
        {hero}
      </div>
      
      {/* Grid section below */}
      <div
        className={cn(
          'grid',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4',
        )}
        style={{ gap: `${GRID_GAP_PX}px` }}
      >
        {children}
      </div>
    </div>
  );
}
