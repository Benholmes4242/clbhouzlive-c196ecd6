import { useRef, useState, useCallback } from 'react';

interface UseSwipeableCardOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  lockAxis?: 'x' | 'y' | false;
}

interface SwipeState {
  isDragging: boolean;
  direction: 'left' | 'right' | null;
  progress: number;
  transform: string;
}

export const useSwipeableCard = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 90,
  velocityThreshold = 0.3,
  lockAxis = 'x'
}: UseSwipeableCardOptions) => {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    direction: null,
    progress: 0,
    transform: 'translateX(0px) rotate(0deg)'
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);
  const hasTriggered = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startTime.current = Date.now();
    isDragging.current = true;
    hasTriggered.current = false;
    
    setSwipeState(prev => ({
      ...prev,
      isDragging: true
    }));
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if we should lock to horizontal axis
    if (lockAxis === 'x' && absDeltaY > absDeltaX + 12) {
      // User is scrolling vertically, cancel the swipe
      isDragging.current = false;
      setSwipeState({
        isDragging: false,
        direction: null,
        progress: 0,
        transform: 'translateX(0px) rotate(0deg)'
      });
      return;
    }

    const direction = deltaX > 0 ? 'right' : 'left';
    const progress = Math.min(absDeltaX / threshold, 1);
    const rotation = (deltaX / threshold) * 15; // Max 15 degree rotation
    const clampedDeltaX = Math.max(-200, Math.min(200, deltaX)); // Clamp movement

    setSwipeState({
      isDragging: true,
      direction,
      progress,
      transform: `translateX(${clampedDeltaX}px) rotate(${rotation}deg)`
    });
  }, [threshold, lockAxis]);

  const handleEnd = useCallback((clientX: number) => {
    if (!isDragging.current) return;

    const deltaX = clientX - startX.current;
    const absDeltaX = Math.abs(deltaX);
    const duration = Date.now() - startTime.current;
    const velocity = absDeltaX / duration; // pixels per ms

    const shouldTrigger = absDeltaX >= threshold || velocity >= velocityThreshold;

    if (shouldTrigger && !hasTriggered.current) {
      hasTriggered.current = true;
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    isDragging.current = false;
    setSwipeState({
      isDragging: false,
      direction: null,
      progress: 0,
      transform: 'translateX(0px) rotate(0deg)'
    });
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    onPointerUp: (e: React.PointerEvent) => {
      handleEnd(e.clientX);
    },
    onPointerCancel: () => {
      isDragging.current = false;
      setSwipeState({
        isDragging: false,
        direction: null,
        progress: 0,
        transform: 'translateX(0px) rotate(0deg)'
      });
    },
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX);
    },
    style: {
      touchAction: lockAxis === 'x' ? 'pan-y' : 'auto',
      userSelect: 'none' as const
    }
  };

  return {
    bind,
    swipeState
  };
};