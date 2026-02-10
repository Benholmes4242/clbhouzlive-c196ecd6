/**
 * LazyMediaGridItem - Placeholder for course media grid lazy loading
 * Shows skeleton until item enters viewport
 */

import React, { useCallback } from 'react';

interface LazyMediaGridItemProps {
  index: number;
  registerTile: (index: number, element: HTMLElement | null) => void;
}

export const LazyMediaGridItem: React.FC<LazyMediaGridItemProps> = ({
  index,
  registerTile,
}) => {
  const refCallback = useCallback(
    (el: HTMLDivElement | null) => {
      registerTile(index, el);
    },
    [index, registerTile]
  );

  return (
    <div
      ref={refCallback}
      data-lazy-index={index}
      className="relative aspect-square bg-muted animate-pulse"
    />
  );
};
