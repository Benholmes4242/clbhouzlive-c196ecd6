import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVideoVisibilityOptions {
  threshold?: number;
  onEnterView?: () => void;
  onExitView?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | any>;
  shouldAutoplay?: boolean;
  globallyMuted?: boolean;
}

export const useVideoVisibility = ({
  threshold = 0.5,
  onEnterView,
  onExitView,
  videoRef,
  shouldAutoplay = true,
  globallyMuted = true
}: UseVideoVisibilityOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isNowVisible = entry.isIntersecting;
    
    setIsVisible(isNowVisible);
    
    if (isNowVisible && !hasBeenVisible) {
      setHasBeenVisible(true);
    }

    const video = videoRef?.current;
    if (!video) return;

    if (isNowVisible) {
      // Video entered view
      if (video instanceof HTMLVideoElement) {
        video.muted = globallyMuted;
      }
      if (shouldAutoplay) {
        video.play?.().catch(console.error);
      }
      onEnterView?.();
    } else {
      // Video exited view - always mute and optionally pause
      if (video instanceof HTMLVideoElement) {
        video.muted = true;
        if (!video.paused) {
          video.pause();
        }
      } else if (video.pause) {
        video.pause();
      }
      onExitView?.();
    }
  }, [videoRef, shouldAutoplay, globallyMuted, hasBeenVisible, onEnterView, onExitView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: threshold,
      rootMargin: '0px'
    });

    observer.observe(container);

    // Check if already visible on mount - use setTimeout to ensure video element is ready
    const checkInitialVisibility = () => {
      const rect = container.getBoundingClientRect();
      const isAlreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isAlreadyVisible) {
        // Directly handle visibility for already visible elements
        setIsVisible(true);
        setHasBeenVisible(true);
        
        const video = videoRef?.current;
        if (video) {
          if (video instanceof HTMLVideoElement) {
            video.muted = globallyMuted;
          }
          if (shouldAutoplay) {
            video.play?.().catch(console.error);
          }
          onEnterView?.();
        }
      }
    };

    // Small delay to ensure video element is mounted and ready
    const timeoutId = setTimeout(checkInitialVisibility, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [handleIntersection, threshold]);

  // Update video mute state when global mute changes (only for visible videos)
  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !isVisible) return;
    
    if (video instanceof HTMLVideoElement) {
      video.muted = globallyMuted;
    }
  }, [globallyMuted, isVisible, videoRef]);

  return {
    containerRef,
    isVisible,
    hasBeenVisible
  };
};