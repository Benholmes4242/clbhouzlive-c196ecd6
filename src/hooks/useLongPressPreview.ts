import { useState, useRef, useCallback } from 'react';

interface UseLongPressPreviewProps {
  onTap: () => void;
  onPreviewStart: () => void;
  onPreviewStop: () => void;
  longPressThreshold?: number;
}

export const useLongPressPreview = ({
  onTap,
  onPreviewStart, 
  onPreviewStop,
  longPressThreshold = 400
}: UseLongPressPreviewProps) => {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isHoverPreviewActive, setIsHoverPreviewActive] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startPreview = useCallback(() => {
    if (!isPreviewActive) {
      setIsPreviewActive(true);
      onPreviewStart();
    }
  }, [isPreviewActive, onPreviewStart]);

  const stopPreview = useCallback(() => {
    if (isPreviewActive) {
      setIsPreviewActive(false);
      onPreviewStop();
    }
  }, [isPreviewActive, onPreviewStop]);

  const startHoverPreview = useCallback(() => {
    // Only start hover preview on devices that support hover (not touch devices)
    if (window.matchMedia('(hover: hover)').matches && !isHoverPreviewActive) {
      setIsHoverPreviewActive(true);
      onPreviewStart();
    }
  }, [isHoverPreviewActive, onPreviewStart]);

  const stopHoverPreview = useCallback(() => {
    if (isHoverPreviewActive) {
      setIsHoverPreviewActive(false);
      onPreviewStop();
    }
  }, [isHoverPreviewActive, onPreviewStop]);

  // Touch/Mouse handlers for long press
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      startPreview();
    }, longPressThreshold);
  }, [longPressThreshold, startPreview]);

  const handleEnd = useCallback(() => {
    clearTimer();
    
    if (isLongPress.current) {
      // Was a long press - stop preview, don't trigger tap
      stopPreview();
    } else {
      // Was a short tap - trigger tap action
      onTap();
    }
    
    isLongPress.current = false;
  }, [clearTimer, stopPreview, onTap]);

  const handleCancel = useCallback(() => {
    clearTimer();
    stopPreview();
    isLongPress.current = false;
  }, [clearTimer, stopPreview]);

  // Mouse handlers for desktop hover
  const handleMouseEnter = useCallback(() => {
    startHoverPreview();
  }, [startHoverPreview]);

  const handleMouseLeave = useCallback(() => {
    handleCancel();
    stopHoverPreview();
  }, [handleCancel, stopHoverPreview]);

  // Click handler for desktop
  const handleClick = useCallback(() => {
    // Only trigger click if not currently in a long press
    if (!isLongPress.current) {
      onTap();
    }
  }, [onTap]);

  return {
    // Touch/mobile handlers
    onTouchStart: handleStart,
    onTouchEnd: handleEnd,
    onTouchCancel: handleCancel,
    
    // Mouse/desktop handlers
    onMouseDown: handleStart,
    onMouseUp: handleEnd,
    onMouseLeave: handleMouseLeave,
    onMouseEnter: handleMouseEnter,
    onClick: handleClick,
    
    // State
    isPreviewActive: isPreviewActive || isHoverPreviewActive,
    
    // Manual controls
    stopPreview: () => {
      stopPreview();
      stopHoverPreview();
    }
  };
};