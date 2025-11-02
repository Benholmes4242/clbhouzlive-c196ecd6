/**
 * Lightweight Virtual List Component
 * Optimized for large message threads and conversation history
 */

import React, { useRef, useState, useCallback, useLayoutEffect, useMemo } from 'react';

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
 * - Dynamic height measurement with prefix sums for O(1) lookups
 * - Overscan for smooth scrolling
 * - Proper absolute positioning with scroll container
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
  const [sizes, setSizes] = useState<number[]>(
    () => Array(count).fill(estimateSize)
  );

  // Expand/shrink sizes array when count changes
  useLayoutEffect(() => {
    setSizes(prev => {
      if (prev.length === count) return prev;
      const next = Array(count).fill(estimateSize);
      for (let i = 0; i < Math.min(prev.length, count); i++) next[i] = prev[i];
      // Optional: seed with getSize hints
      if (getSize) {
        for (let i = 0; i < count; i++) next[i] = getSize(i) ?? next[i];
      }
      return next;
    });
  }, [count, estimateSize, getSize]);

  // Prefix sums for O(1) top offsets
  const prefix = useMemo(() => {
    const p = new Array(sizes.length + 1).fill(0);
    for (let i = 0; i < sizes.length; i++) p[i + 1] = p[i] + sizes[i];
    return p;
  }, [sizes]);

  const totalHeight = prefix[prefix.length - 1];

  // Find first visible index via linear scan
  let start = 0;
  while (start < count && prefix[start + 1] < scrollTop) start++;

  // Find end index
  const viewport = containerRef.current?.clientHeight ?? 0;
  let end = start;
  const maxY = scrollTop + viewport;
  while (end < count && prefix[end] < maxY) end++;

  // Apply overscan
  const visStart = Math.max(0, start - overscan);
  const visEnd = Math.min(count, end + overscan);

  const measure = useCallback((index: number, height: number) => {
    setSizes(prev => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{ overflowY: 'auto', height: '100%' }}
      role="list"
    >
      {/* Spacer to create the full scroll range */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {Array.from({ length: visEnd - visStart }, (_, k) => {
          const i = visStart + k;
          const top = prefix[i];
          return (
            <div
              key={i}
              style={{ position: 'absolute', top, left: 0, right: 0 }}
              role="listitem"
            >
              <Sizer onSize={h => measure(i, h)}>
                {render(i)}
              </Sizer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
