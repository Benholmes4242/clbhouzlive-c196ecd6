import { useState, useEffect, useMemo, useCallback } from 'react';
import { useScrollPerformance } from './usePerformanceOptimizations';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualizedList = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualizedListProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [items, visibleRange, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative' as const,
    },
    onScroll: handleScroll,
  };

  const innerProps = {
    style: {
      height: items.length * itemHeight,
      position: 'relative' as const,
    },
  };

  return {
    visibleItems,
    containerProps,
    innerProps,
    totalHeight: items.length * itemHeight,
  };
};