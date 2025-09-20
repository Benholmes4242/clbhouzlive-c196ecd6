import { useState, useRef, useCallback } from 'react';
import { useExclusiveVideoAudio } from './useExclusiveVideoAudio';

interface UseDiscoverMediaPreviewProps {
  itemId: string;
  mediaType: 'video' | 'image';
  isVideo: boolean;
}

export const useDiscoverMediaPreview = ({ 
  itemId, 
  mediaType, 
  isVideo 
}: UseDiscoverMediaPreviewProps) => {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isHoverPreviewActive, setIsHoverPreviewActive] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  // Use exclusive video audio for videos only
  const { isMuted, toggleMute } = useExclusiveVideoAudio(itemId);

  const clearTimers = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startPreview = useCallback(() => {
    if (!isVideo) return;
    if (!isPreviewActive) {
      setIsPreviewActive(true);
    }
  }, [isVideo, isPreviewActive]);

  const stopPreview = useCallback(() => {
    if (isPreviewActive) {
      setIsPreviewActive(false);
    }
  }, [isPreviewActive]);

  const startHoverPreview = useCallback(() => {
    if (!isVideo) return;
    // Only start hover preview on devices that support hover
    if (window.matchMedia('(hover: hover)').matches && !isHoverPreviewActive) {
      setIsHoverPreviewActive(true);
    }
  }, [isVideo, isHoverPreviewActive]);

  const stopHoverPreview = useCallback(() => {
    if (isHoverPreviewActive) {
      setIsHoverPreviewActive(false);
    }
  }, [isHoverPreviewActive]);

  // Desktop hover handlers
  const handleMouseEnter = useCallback(() => {
    if (!isVideo) return;
    clearTimers();
    
    // Small delay before starting preview to avoid flicker on quick hovers
    hoverTimer.current = setTimeout(() => {
      startHoverPreview();
    }, 100);
  }, [isVideo, startHoverPreview, clearTimers]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    stopHoverPreview();
    stopPreview();
    isLongPress.current = false;
  }, [clearTimers, stopHoverPreview, stopPreview]);

  // Mobile long-press handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isVideo) return;
    
    isLongPress.current = false;
    clearTimers();
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      startPreview();
    }, 400); // 400ms long press threshold
  }, [isVideo, startPreview, clearTimers]);

  const handleTouchEnd = useCallback(() => {
    clearTimers();
    
    if (isLongPress.current) {
      // Was a long press - stop preview
      stopPreview();
    }
    
    isLongPress.current = false;
  }, [clearTimers, stopPreview]);

  const handleTouchCancel = useCallback(() => {
    clearTimers();
    stopPreview();
    isLongPress.current = false;
  }, [clearTimers, stopPreview]);

  // Mouse handlers for desktop long-press alternative
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isVideo) return;
    // Prevent text selection during long press
    e.preventDefault();
    
    isLongPress.current = false;
    clearTimers();
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      startPreview();
    }, 400);
  }, [isVideo, startPreview, clearTimers]);

  const handleMouseUp = useCallback(() => {
    clearTimers();
    
    if (isLongPress.current) {
      stopPreview();
    }
    
    isLongPress.current = false;
  }, [clearTimers, stopPreview]);

  const shouldAutoplay = isVideo && (isPreviewActive || isHoverPreviewActive);
  const shouldMute = true; // Always muted for preview in Discover

  return {
    // Event handlers for the container
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    
    // State
    shouldAutoplay,
    shouldMute,
    isPreviewActive: isPreviewActive || isHoverPreviewActive,
    
    // Manual control
    stopAllPreviews: () => {
      clearTimers();
      stopPreview();
      stopHoverPreview();
    }
  };
};