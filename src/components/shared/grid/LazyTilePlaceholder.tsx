/**
 * LazyTilePlaceholder - Placeholder for tiles not yet visible
 * 
 * TikTok-level polish:
 * - Scroll-direction shimmer animation
 * - Rendered in place of actual tiles until they enter the viewport
 * - Uses ref callback to register with IntersectionObserver for lazy loading
 */

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyTilePlaceholderProps {
  index: number;
  variant: 'portrait' | 'landscape';
  registerTile: (index: number, element: HTMLElement | null) => void;
}

const LazyTilePlaceholder: React.FC<LazyTilePlaceholderProps> = ({
  index,
  variant,
  registerTile,
}) => {
  const refCallback = useCallback(
    (el: HTMLDivElement | null) => {
      registerTile(index, el);
    },
    [index, registerTile]
  );
  
  const isLandscape = variant === 'landscape';
  const aspectClass = isLandscape ? 'aspect-[16/9]' : 'aspect-[3/4]';
  
  return (
    <div
      ref={refCallback}
      data-lazy-index={index}
      className={cn(
        aspectClass,
        "relative bg-muted/20 overflow-hidden",
        isLandscape && "col-span-2"
      )}
    >
      {/* Scroll-direction shimmer overlay */}
      <div className="absolute inset-0 shimmer-down" />
    </div>
  );
};

export default LazyTilePlaceholder;
