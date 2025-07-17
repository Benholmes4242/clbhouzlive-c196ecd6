import { useRef, useEffect, useCallback } from 'react';

interface AutoplayManagerOptions {
  interval: number; // Every nth video should autoplay (e.g., 8)
  threshold: number; // Intersection observer threshold
}

export const useAutoplayManager = ({ interval = 8, threshold = 0.5 }: AutoplayManagerOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  const autoplayingVideosRef = useRef<Set<string>>(new Set());

  // Initialize intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute('data-video-id');
          if (!videoId) return;

          if (entry.isIntersecting) {
            // Video is in view, check if it should autoplay
            const videoIndex = parseInt(entry.target.getAttribute('data-video-index') || '0');
            if ((videoIndex + 1) % interval === 0) {
              autoplayingVideosRef.current.add(videoId);
              // Trigger custom event to start autoplay
              entry.target.dispatchEvent(new CustomEvent('startAutoplay'));
            }
          } else {
            // Video is out of view, stop autoplay
            if (autoplayingVideosRef.current.has(videoId)) {
              autoplayingVideosRef.current.delete(videoId);
              // Trigger custom event to stop autoplay
              entry.target.dispatchEvent(new CustomEvent('stopAutoplay'));
            }
          }
        });
      },
      { threshold }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [interval, threshold]);

  // Register a video element for autoplay management
  const registerVideo = useCallback((videoId: string, element: HTMLElement, index: number) => {
    if (!observerRef.current || !element) return;

    // Store the element reference
    videoRefsRef.current.set(videoId, element);
    
    // Add data attributes for identification
    element.setAttribute('data-video-id', videoId);
    element.setAttribute('data-video-index', index.toString());
    
    // Start observing
    observerRef.current.observe(element);
  }, []);

  // Unregister a video element
  const unregisterVideo = useCallback((videoId: string) => {
    if (!observerRef.current) return;

    const element = videoRefsRef.current.get(videoId);
    if (element) {
      observerRef.current.unobserve(element);
      videoRefsRef.current.delete(videoId);
      autoplayingVideosRef.current.delete(videoId);
    }
  }, []);

  // Check if a video should autoplay based on its index
  const shouldVideoAutoplay = useCallback((index: number) => {
    return (index + 1) % interval === 0;
  }, [interval]);

  // Check if a video is currently autoplaying
  const isVideoAutoplaying = useCallback((videoId: string) => {
    return autoplayingVideosRef.current.has(videoId);
  }, []);

  return {
    registerVideo,
    unregisterVideo,
    shouldVideoAutoplay,
    isVideoAutoplaying,
  };
};