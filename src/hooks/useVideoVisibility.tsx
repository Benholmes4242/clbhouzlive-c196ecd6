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
    
    const video = videoRef?.current;
    if (!video) return;

    if (isNowVisible) {
      // Video entered view - always mark as having been visible
      setHasBeenVisible(true);
      
      // Set mute state and autoplay with mobile-optimized approach
      if (video instanceof HTMLVideoElement) {
        video.muted = globallyMuted;
        
        if (shouldAutoplay) {
          // iOS Safari fix: seek nudge to prevent black first frame
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            video.currentTime = 0.001;
          }
          
          // Wait for video to be ready before playing
          const attemptPlay = async () => {
            try {
              // Ensure video has enough data to play
              if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                await video.play();
                onEnterView?.();
              } else {
                // Wait for video to be ready
                const handleCanPlay = async () => {
                  video.removeEventListener('canplay', handleCanPlay);
                  try {
                    await video.play();
                    onEnterView?.();
                  } catch (error) {
                    console.warn('Mobile autoplay failed after canplay:', error);
                  }
                };
                video.addEventListener('canplay', handleCanPlay, { once: true });
              }
            } catch (error) {
              console.warn('Mobile autoplay failed:', error);
              // Still call onEnterView for UI consistency
              onEnterView?.();
            }
          };
          
          attemptPlay();
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
        if (video && shouldAutoplay) {
          if (video instanceof HTMLVideoElement) {
            video.muted = globallyMuted;
            
            // iOS Safari fix for initial load
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
              video.currentTime = 0.001;
            }
            
            // Ensure video is ready before playing
            if (video.readyState >= 3) {
              video.play?.().catch((error: any) => console.warn('Initial mobile autoplay failed:', error));
            } else {
              const handleReady = () => {
                video.removeEventListener('canplay', handleReady);
                video.play?.().catch((error: any) => console.warn('Initial mobile autoplay failed after ready:', error));
              };
              video.addEventListener('canplay', handleReady, { once: true });
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