import { useEffect, useRef, useState, useCallback } from 'react';
import { safePlay, isInWebView, prefersReducedMotion } from '@/utils/safePlay';

interface UseVideoVisibilityOptions {
  threshold?: number | number[];
  onEnterView?: () => void;
  onExitView?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | any>;
  shouldAutoplay?: boolean;
  globallyMuted?: boolean;
}

export const useVideoVisibility = ({
  threshold = [0, 0.1, 0.25, 0.5, 0.75, 1],
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
    const visibilityRatio = entry.intersectionRatio;
    
    setIsVisible(isNowVisible);
    
    const video = videoRef?.current;
    if (!video) return;

    // Environment guards
    if (prefersReducedMotion() && shouldAutoplay) {
      // Skip autoplay for reduced motion preference
      if (isNowVisible) {
        onEnterView?.();
      } else {
        onExitView?.();
      }
      return;
    }

    // Stricter thresholds for WebViews
    const playThreshold = isInWebView ? 0.5 : 0.5;
    const shouldPlay = isNowVisible && visibilityRatio >= playThreshold;

    if (shouldPlay) {
      // Video entered view with sufficient visibility - mark as having been visible
      setHasBeenVisible(true);
      
      // Set mute state and attempt autoplay
      if (video instanceof HTMLVideoElement) {
        video.muted = globallyMuted;
        
        if (shouldAutoplay && !video.hasAttribute('data-autoplay-blocked')) {
          // Use safePlay utility for robust autoplay
          safePlay(video).then(success => {
            if (success) {
              onEnterView?.();
            } else {
              // Still call onEnterView for UI consistency
              onEnterView?.();
            }
          });
        } else {
          onEnterView?.();
        }
      } else {
        // Non-HTMLVideoElement (HLS players)
        if (shouldAutoplay) {
          video.play?.().catch((error: any) => {
            console.warn('Mobile autoplay failed for HLS:', error);
            onEnterView?.();
          });
        } else {
          onEnterView?.();
        }
      }
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
  }, [videoRef, shouldAutoplay, globallyMuted, onEnterView, onExitView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: threshold,
      rootMargin: '0px 0px 12% 0px' // Start decoding just before on-screen
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
        if (video && shouldAutoplay && !prefersReducedMotion()) {
          if (video instanceof HTMLVideoElement) {
            video.muted = globallyMuted;
            
            // Use safePlay for initial autoplay as well
            if (!video.hasAttribute('data-autoplay-blocked')) {
              safePlay(video).catch((error: any) => console.warn('Initial mobile autoplay failed:', error));
            }
          } else {
            video.play?.().catch((error: any) => console.warn('Initial HLS autoplay failed:', error));
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