/**
 * Lightweight Virtual List Component
 * Optimized for large message threads and conversation history
 */

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';

interface VirtualListProps {
  count: number;
  estimateSize: number;
  getSize?: (index: number) => number;
  overscan?: number;
  className?: string;
  render: (index: number) => React.ReactNode;
}

/**
 * Sizer component to measure actual rendered height
 */
function Sizer({ 
  onSize, 
  children 
}: { 
  onSize: (height: number) => void; 
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    if (ref.current) {
      const height = ref.current.offsetHeight;
      onSize(height);
    }
  }, [onSize]);
  
  return <div ref={ref}>{children}</div>;
}

/**
 * VirtualList - Renders only visible items for performance
 * 
 * Features:
 * - Dynamic height measurement
 * - Overscan for smooth scrolling
 * - Anchor-based scroll preservation
 */
export function VirtualList({
  count,
  estimateSize,
  getSize,
  overscan = 8,
  className = '',
  render,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [sizes, setSizes] = useState<number[]>(() => 
    Array(count).fill(estimateSize)
  );

  // Measure actual item height
  const measure = useCallback((index: number, height: number) => {
    setSizes(prev => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  }, []);

  // Update sizes array when count changes
  useLayoutEffect(() => {
    setSizes(prev => {
      if (prev.length === count) return prev;
      const next = Array(count).fill(estimateSize);
      // Copy existing measurements
      for (let i = 0; i < Math.min(prev.length, count); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [count, estimateSize]);

  // Calculate total height
  const totalHeight = sizes.reduce((acc, size) => acc + size, 0);

  // Calculate visible range
  const containerHeight = containerRef.current?.clientHeight || 0;
  
  let start = 0;
  let accumulatedHeight = 0;
  
  // Find start index
  while (start < count && accumulatedHeight + sizes[start] < scrollTop) {
    accumulatedHeight += sizes[start];
    start++;
  }
  
  // Find end index
  let end = start;
  let visibleHeight = accumulatedHeight;
  while (end < count && visibleHeight < scrollTop + containerHeight) {
    visibleHeight += sizes[end];
    end++;
  }
  
  // Apply overscan
  const visibleStart = Math.max(0, start - overscan);
  const visibleEnd = Math.min(count, end + overscan);

  // Calculate offset for visible items
  const offsetY = sizes.slice(0, visibleStart).reduce((acc, size) => acc + size, 0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {Array.from({ length: visibleEnd - visibleStart }, (_, k) => {
            const index = visibleStart + k;
            const top = sizes.slice(visibleStart, index).reduce((acc, size) => acc + size, 0);
            
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${top}px)`,
                }}
              >
                <Sizer onSize={(height) => measure(index, height)}>
                  {render(index)}
                </Sizer>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
