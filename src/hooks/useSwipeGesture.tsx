import { useRef, useEffect, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void | Promise<void>;
  onSwipeRight?: () => void | Promise<void>;
  onSwipeUp?: () => void | Promise<void>;
  onSwipeDown?: () => void | Promise<void>;
  threshold?: number;
  // Kept for backward-compat; we rely on CSS touch-action instead
  preventDefaultTouchMove?: boolean;
  onSwiping?: (deltaX: number, deltaY: number) => void;
  onSwipeEnd?: () => void;
}

// Keep the latest handlers without re-binding listeners
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  // preventDefaultTouchMove is ignored; rely on touch-action CSS
  preventDefaultTouchMove,
  onSwiping,
  onSwipeEnd,
}: SwipeGestureOptions) => {
  const latest = useLatest({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    onSwiping,
    onSwipeEnd,
  });

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const t = e.targetTouches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchEndX.current = t.clientX;
    touchEndY.current = t.clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const t = e.targetTouches[0];
    const deltaX = t.clientX - touchStartX.current;
    const deltaY = t.clientY - touchStartY.current;

    // update latest end positions
    touchEndX.current = t.clientX;
    touchEndY.current = t.clientY;

    // Live feedback (do not preventDefault; use CSS touch-action to manage scroll)
    latest.current.onSwiping?.(deltaX, deltaY);
  }, [latest]);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;

    const th = latest.current.threshold ?? 50;

    const isLeftSwipe = deltaX > th;
    const isRightSwipe = deltaX < -th;
    const isUpSwipe = deltaY > th;
    const isDownSwipe = deltaY < -th;

    // Axis lock: prefer vertical when clearly vertical (|dy| > |dx| + 12)
    if (Math.abs(deltaY) > Math.abs(deltaX) + 12) {
      if (isUpSwipe) latest.current.onSwipeUp?.();
      else if (isDownSwipe) latest.current.onSwipeDown?.();
    } else {
      if (isLeftSwipe) latest.current.onSwipeLeft?.();
      else if (isRightSwipe) latest.current.onSwipeRight?.();
    }

    latest.current.onSwipeEnd?.();
  }, [latest]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart as EventListener);
      el.removeEventListener('touchmove', handleTouchMove as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
};