import { useRef, useEffect, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  dependencies: any[];
  enabled?: boolean;
  behavior?: ScrollBehavior;
  threshold?: number;
}

export const useAutoScroll = ({
  dependencies,
  enabled = true,
  behavior = 'smooth',
  threshold = 100
}: UseAutoScrollOptions) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Check if user is near bottom of scroll area
  const checkScrollPosition = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;
    
    setIsAtBottom(isNearBottom);
    setUserHasScrolledUp(!isNearBottom);
  }, [threshold]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (!scrollAreaRef.current || !enabled) return;
    
    setTimeout(() => {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior
        });
        setUserHasScrolledUp(false);
        setIsAtBottom(true);
      }
    }, 100);
  }, [enabled, behavior]);

  // Auto-scroll when dependencies change (new messages)
  useEffect(() => {
    if (!userHasScrolledUp && enabled) {
      scrollToBottom();
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

  // Force scroll to bottom (for manual trigger)
  const forceScrollToBottom = useCallback(() => {
    setUserHasScrolledUp(false);
    scrollToBottom();
  }, [scrollToBottom]);

  return {
    scrollAreaRef,
    scrollToBottom: forceScrollToBottom,
    isAtBottom,
    userHasScrolledUp
  };
};