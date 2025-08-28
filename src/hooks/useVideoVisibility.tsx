import { useEffect, useRef, useState, useCallback } from 'react';
import { FeedVideoPlayerRef } from '@/components/feed/FeedVideoPlayer';

interface UseVideoVisibilityOptions {
  threshold?: number;
  onEnterView?: () => void;
  onExitView?: () => void;
  videoRef?: React.RefObject<FeedVideoPlayerRef>;
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

    const player = videoRef?.current;
    if (!player) return;

    if (isNowVisible) {
      // Player entered view
      if (shouldAutoplay && player.play) {
        player.play();
      }
      onEnterView?.();
    } else {
      // Player exited view - pause
      if (player.pause) {
        player.pause();
      }
      onExitView?.();
    }
  }, [videoRef, shouldAutoplay, hasBeenVisible, onEnterView, onExitView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: threshold,
      rootMargin: '0px'
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);

  // Note: Mute state is now managed by the parent components via useExclusiveVideoAudio
  // This hook no longer directly controls mute state to avoid conflicts with iframe players

  return {
    containerRef,
    isVisible,
    hasBeenVisible
  };
};