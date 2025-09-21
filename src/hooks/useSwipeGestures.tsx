import { useCallback, useRef, useState } from 'react';

interface SwipeGestureConfig {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxAngle?: number;
  disabled?: boolean;
  preventVerticalScroll?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useSwipeGestures = ({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxAngle = 45,
  disabled = false,
  preventVerticalScroll = true
}: SwipeGestureConfig) => {
  const startPoint = useRef<TouchPoint | null>(null);
  const [isGesturing, setIsGesturing] = useState(false);

  const calculateAngle = (dx: number, dy: number): number => {
    return Math.abs((Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI);
  };

  const handleTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (disabled) return;
    
    const touch = 'touches' in e ? e.touches[0] : e as any;
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    setIsGesturing(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (disabled || !startPoint.current) return;

    const touch = 'touches' in e ? e.touches[0] : e as any;
    const dx = touch.clientX - startPoint.current.x;
    const dy = touch.clientY - startPoint.current.y;
    const angle = calculateAngle(dx, dy);

    // Prevent vertical scroll if this might be a vertical swipe
    if (preventVerticalScroll && Math.abs(dy) > 10 && angle > 45) {
      e.preventDefault();
    }

    // Prevent horizontal scroll if this might be a horizontal swipe
    if (Math.abs(dx) > 10 && angle <= 45) {
      e.preventDefault();
    }
  }, [disabled, preventVerticalScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (disabled || !startPoint.current) {
      setIsGesturing(false);
      return;
    }

    const touch = 'changedTouches' in e ? e.changedTouches[0] : e as any;
    const dx = touch.clientX - startPoint.current.x;
    const dy = touch.clientY - startPoint.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - startPoint.current.timestamp;
    const velocity = distance / duration;

    // Must meet minimum threshold and velocity
    if (distance < threshold || velocity < 0.1) {
      startPoint.current = null;
      setIsGesturing(false);
      return;
    }

    const angle = calculateAngle(dx, dy);

    // Vertical swipes
    if (angle > maxAngle) {
      if (dy > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (dy < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    // Horizontal swipes
    else {
      if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    startPoint.current = null;
    setIsGesturing(false);
  }, [disabled, threshold, maxAngle, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    gestureHandlers,
    isGesturing
  };
};