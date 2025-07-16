import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface UseClubhouseAutoplayOptions {
  index: number; // 0-based index of the post in the feed
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useClubhouseAutoplay = (options: UseClubhouseAutoplayOptions) => {
  const {
    index,
    enabled = true,
    threshold = 0.5,
    rootMargin = '0px'
  } = options;

  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const activeVideoRef = useRef<string | null>(null);
  
  // Use intersection observer for scroll-based visibility
  const { ref: observerRef, isInView } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  // Determine if this is a 3rd, 6th, 9th, etc. post (1-based indexing)
  const isAutoplayEligible = useCallback(() => {
    const oneBasedIndex = index + 1;
    return oneBasedIndex % 3 === 0;
  }, [index]);

  // Update autoplay state based on visibility and eligibility
  useEffect(() => {
    if (!enabled) {
      setShouldAutoplay(false);
      return;
    }

    // Only autoplay if this is an eligible video (every 3rd) AND it's in view
    const shouldPlay = isAutoplayEligible() && isInView;
    setShouldAutoplay(shouldPlay);

    // Global video management - pause others when this one should play
    if (shouldPlay) {
      // Store reference to currently active video
      activeVideoRef.current = `clubhouse-${index}`;
      
      // Dispatch custom event to pause other videos
      window.dispatchEvent(new CustomEvent('clubhouse-video-autoplay', {
        detail: { activeVideoIndex: index }
      }));
    }
  }, [enabled, isInView, index, isAutoplayEligible]);

  // Listen for other videos starting autoplay and pause this one if needed
  useEffect(() => {
    const handleOtherVideoAutoplay = (event: CustomEvent) => {
      const { activeVideoIndex } = event.detail;
      
      // If another video is starting autoplay and it's not this one, pause this one
      if (activeVideoIndex !== index && shouldAutoplay) {
        setShouldAutoplay(false);
      }
    };

    window.addEventListener('clubhouse-video-autoplay', handleOtherVideoAutoplay as EventListener);
    
    return () => {
      window.removeEventListener('clubhouse-video-autoplay', handleOtherVideoAutoplay as EventListener);
    };
  }, [index, shouldAutoplay]);

  return {
    ref: observerRef,
    shouldAutoplay,
    isInView,
    isAutoplayEligible: isAutoplayEligible(),
    videoId: `clubhouse-${index}`
  };
};