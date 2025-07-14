import { useMemo, useState, useEffect } from 'react';

interface UseVirtualListProps {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  overscan?: number;
}

export const useVirtualList = ({
  itemCount,
  itemHeight,
  containerHeight,
  scrollTop,
  overscan = 5
}: UseVirtualListProps) => {
  const virtualItems = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      itemCount
    );
    
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount, visibleEnd + overscan);
    
    const items = [];
    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        height: itemHeight
      });
    }
    
    return {
      items,
      totalHeight: itemCount * itemHeight,
      visibleStart,
      visibleEnd,
      start,
      end
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop, overscan]);
  
  return virtualItems;
};