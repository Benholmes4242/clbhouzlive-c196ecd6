import { useRef, useEffect } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchMove?: boolean;
  onSwiping?: (deltaX: number, deltaY: number) => void;
  onSwipeEnd?: () => void;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefaultTouchMove = false,
  onSwiping,
  onSwipeEnd
}: SwipeGestureOptions) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (preventDefaultTouchMove) {
      e.preventDefault();
    }
    
    if (onSwiping) {
      const deltaX = e.targetTouches[0].clientX - touchStartX.current;
      const deltaY = e.targetTouches[0].clientY - touchStartY.current;
      onSwiping(deltaX, deltaY);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    checkDirection();
    if (onSwipeEnd) {
      onSwipeEnd();
    }
  };

  const checkDirection = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    
    const isLeftSwipe = deltaX > threshold;
    const isRightSwipe = deltaX < -threshold;
    const isUpSwipe = deltaY > threshold;
    const isDownSwipe = deltaY < -threshold;

    // Check for vertical swipes first (axis lock: |dy| > |dx| + 12)
    if (Math.abs(deltaY) > Math.abs(deltaX) + 12) {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
        return;
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
        return;
      }
    }

    // Then check horizontal swipes
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventDefaultTouchMove, onSwiping, onSwipeEnd]);

  return elementRef;
};