import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { throttle } from '@/utils/performance';
import { FLAGS } from '@/config/flags';

interface VirtualizedFeedProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  containerHeight?: number;
}

export const VirtualizedFeed = React.memo(<T,>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  containerHeight = 600,
}: VirtualizedFeedProps<T>) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(Math.ceil(containerHeight / itemHeight) + overscan);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(
    throttle(() => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const containerHeight = containerRef.current.clientHeight;
      
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const newEndIndex = Math.min(items.length, newStartIndex + visibleCount + overscan * 2);
      
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }, 16), // 60fps
    [itemHeight, overscan, items.length]
  );
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  // Fallback to regular rendering if virtualization is disabled
  if (!FLAGS.perfTuning) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => 
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

(VirtualizedFeed as any).displayName = 'VirtualizedFeed';

export default VirtualizedFeed;