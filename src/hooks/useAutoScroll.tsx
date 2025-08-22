import { useRef, useEffect, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  dependencies: any[];
  enabled?: boolean;
  behavior?: ScrollBehavior;
  threshold?: number;
  direction?: 'top' | 'bottom'; // New: specify scroll direction
}

export const useAutoScroll = ({
  dependencies,
  enabled = true,
  behavior = 'smooth',
  threshold = 100,
  direction = 'bottom' // Default to bottom for backward compatibility
}: UseAutoScrollOptions) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledAway, setUserHasScrolledAway] = useState(false);
  const [isAtTarget, setIsAtTarget] = useState(true);

  // Check if user is at the target position (top or bottom)
  const checkScrollPosition = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
    
    let isAtTargetPosition: boolean;
    if (direction === 'top') {
      // For top direction, check if we're near the top
      isAtTargetPosition = scrollTop <= threshold;
    } else {
      // For bottom direction, check if we're near the bottom
      isAtTargetPosition = scrollHeight - scrollTop - clientHeight <= threshold;
    }
    
    setIsAtTarget(isAtTargetPosition);
    setUserHasScrolledAway(!isAtTargetPosition);
  }, [threshold, direction]);

  // Scroll to target position function
  const scrollToTarget = useCallback(() => {
    if (!scrollAreaRef.current || !enabled) return;
    
    setTimeout(() => {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const scrollOptions: ScrollToOptions = { behavior };
        
        if (direction === 'top') {
          scrollOptions.top = 0;
        } else {
          scrollOptions.top = scrollContainer.scrollHeight;
        }
        
        scrollContainer.scrollTo(scrollOptions);
        setUserHasScrolledAway(false);
        setIsAtTarget(true);
      }
    }, 100);
  }, [enabled, behavior, direction]);

  // Auto-scroll when dependencies change (new content)
  useEffect(() => {
    if (!userHasScrolledAway && enabled) {
      scrollToTarget();
    }
  }, dependencies);

  // Set up scroll listener
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    
    // Initial check
    checkScrollPosition();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [checkScrollPosition]);

  // Force scroll to target (for manual trigger)
  const forceScrollToTarget = useCallback(() => {
    setUserHasScrolledAway(false);
    scrollToTarget();
  }, [scrollToTarget]);

  return {
    scrollAreaRef,
    scrollToTarget: forceScrollToTarget,
    isAtTarget,
    userHasScrolledAway,
    direction
  };
};