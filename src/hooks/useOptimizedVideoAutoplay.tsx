import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedVideoAutoplayOptions {
  threshold?: number;
  videoRef?: React.RefObject<HTMLVideoElement>;
  enabled?: boolean;
  loop?: boolean;
}

/**
 * Optimized video autoplay hook for Discover and Activity feeds
 * 
 * Requirements:
 * - Autoplay at 50% visibility
 * - Pause when <50% visible
 * - Immediate autoplay if already in view on page load
 * - Continuous looping without freezing
 * - Works consistently on first visit and subsequent visits
 */
export const useOptimizedVideoAutoplay = ({
  threshold = 0.5,
  videoRef,
  enabled = true,
  loop = true
}: UseOptimizedVideoAutoplayOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasInitializedRef = useRef(false);

  const handlePlay = useCallback(async () => {
    const video = videoRef?.current;
    if (!video || !enabled) return;

    try {
      // Ensure video is properly configured
      video.muted = true;
      video.loop = loop;
      
      // Retry mechanism for reliable autoplay
      let attempts = 3;
      while (attempts > 0) {
        try {
          await video.play();
          setIsPlaying(true);
          break;
        } catch (error) {
          attempts--;
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            console.warn('Video autoplay failed after retries:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Video play error:', error);
    }
  }, [videoRef, enabled, loop]);

  const handlePause = useCallback(() => {
    const video = videoRef?.current;
    if (!video) return;

    try {
      video.pause();
      setIsPlaying(false);
    } catch (error) {
      console.warn('Video pause error:', error);
    }
  }, [videoRef]);

  // Intersection observer for visibility detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isVisible = entry.isIntersecting;
        
        setIsInView(isVisible);

        if (isVisible) {
          // Small delay for first-time initialization
          const delay = hasInitializedRef.current ? 0 : 200;
          setTimeout(() => {
            handlePlay();
            hasInitializedRef.current = true;
          }, delay);
        } else {
          handlePause();
        }
      },
      {
        threshold,
        rootMargin: '0px'
      }
    );

    observer.observe(container);

    // Check if already in view on initial load
    const initialEntry = observer.takeRecords()[0];
    if (initialEntry?.isIntersecting) {
      setIsInView(true);
      setTimeout(() => {
        handlePlay();
        hasInitializedRef.current = true;
      }, 100);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, handlePlay, handlePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlePause();
    };
  }, [handlePause]);

  return {
    containerRef,
    isInView,
    isPlaying,
    play: handlePlay,
    pause: handlePause
  };
};