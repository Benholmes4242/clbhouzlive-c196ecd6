/**
 * useSwipeNavigation - Touch gesture handling for vertical/horizontal swipe navigation
 * 
 * Features:
 * - Velocity-based scrolling
 * - Snap points
 * - Infinite scroll trigger
 * - Configurable thresholds
 */

import { useRef, useState, useCallback } from 'react';

export interface SwipeNavigationOptions {
  /** Total number of items */
  itemCount: number;
  /** Current index */
  currentIndex: number;
  /** Callback when index changes */
  onIndexChange: (index: number) => void;
  /** Direction of swipe */
  direction?: 'vertical' | 'horizontal';
  /** Minimum distance to trigger swipe (px) */
  threshold?: number;
  /** Velocity threshold for fast swipes */
  velocityThreshold?: number;
  /** Callback when approaching end (for infinite scroll) */
  onApproachEnd?: () => void;
  /** How many items from end to trigger onApproachEnd */
  endThreshold?: number;
  /** Callback when swipe starts */
  onSwipeStart?: () => void;
  /** Callback when swipe ends */
  onSwipeEnd?: () => void;
}

export interface SwipeNavigationReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  isDragging: boolean;
  dragOffset: number;
  dragProgress: number; // 0-1 progress of current drag
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function useSwipeNavigation(options: SwipeNavigationOptions): SwipeNavigationReturn {
  const {
    itemCount,
    currentIndex,
    onIndexChange,
    direction = 'vertical',
    threshold = 50,
    velocityThreshold = 0.3,
    onApproachEnd,
    endThreshold = 3,
    onSwipeStart,
    onSwipeEnd,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Touch tracking refs
  const startPos = useRef(0);
  const startTime = useRef(0);
  const lastPos = useRef(0);
  const isActive = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = direction === 'vertical' ? touch.clientY : touch.clientX;
    startTime.current = Date.now();
    lastPos.current = startPos.current;
    isActive.current = true;
    setIsDragging(true);
    onSwipeStart?.();
  }, [direction, onSwipeStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isActive.current) return;

    const touch = e.touches[0];
    const currentPos = direction === 'vertical' ? touch.clientY : touch.clientX;
    const offset = currentPos - startPos.current;
    
    lastPos.current = currentPos;
    setDragOffset(offset);
  }, [direction]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isActive.current) return;
    isActive.current = false;

    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(dragOffset) / elapsed;
    
    let newIndex = currentIndex;

    // Determine if swipe was significant enough
    const hasEnoughDistance = Math.abs(dragOffset) > threshold;
    const hasEnoughVelocity = velocity > velocityThreshold;
    
    if (hasEnoughDistance || hasEnoughVelocity) {
      if (dragOffset < 0) {
        // Swiped up/left - go to next
        newIndex = Math.min(currentIndex + 1, itemCount - 1);
      } else {
        // Swiped down/right - go to prev
        newIndex = Math.max(currentIndex - 1, 0);
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
    }

    // Check if approaching end
    if (onApproachEnd && newIndex >= itemCount - endThreshold) {
      onApproachEnd();
    }
    
    onSwipeEnd?.();
  }, [
    dragOffset, 
    threshold, 
    velocityThreshold, 
    currentIndex, 
    itemCount, 
    onIndexChange, 
    onApproachEnd, 
    endThreshold,
    onSwipeEnd,
  ]);

  // Calculate drag progress (0-1)
  const itemSize = typeof window !== 'undefined' 
    ? (direction === 'vertical' ? window.innerHeight : window.innerWidth)
    : 1;
  const dragProgress = Math.min(1, Math.abs(dragOffset) / itemSize);

  return {
    containerRef,
    isDragging,
    dragOffset,
    dragProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// ============ Specialized Hooks ============

/**
 * useVerticalSwipe - Shorthand for vertical swipe navigation
 */
export function useVerticalSwipe(
  options: Omit<SwipeNavigationOptions, 'direction'>
): SwipeNavigationReturn {
  return useSwipeNavigation({ ...options, direction: 'vertical' });
}

/**
 * useHorizontalSwipe - Shorthand for horizontal swipe navigation
 */
export function useHorizontalSwipe(
  options: Omit<SwipeNavigationOptions, 'direction'>
): SwipeNavigationReturn {
  return useSwipeNavigation({ ...options, direction: 'horizontal' });
}
