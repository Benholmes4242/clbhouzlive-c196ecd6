import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseHighlightsAutoplayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  highlights: any[];
}

export const useHighlightsAutoplay = ({ containerRef, highlights }: UseHighlightsAutoplayProps) => {
  const isMobile = useIsMobile();
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Register a card element with its index
  const registerCard = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(index, element);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  // Determine which card should be active based on viewport position
  const determineActiveCard = useCallback(() => {
    const container = containerRef.current;
    if (!container || cardRefs.current.size === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerRight = containerRect.right;
    const containerWidth = containerRect.width;

    let newActiveIndex: number | null = null;

    if (isMobile) {
      // Mobile: Find the card that's most visible (> 50%)
      let maxVisibleRatio = 0;
      cardRefs.current.forEach((element, index) => {
        const cardRect = element.getBoundingClientRect();
        const cardLeft = Math.max(cardRect.left, containerLeft);
        const cardRight = Math.min(cardRect.right, containerRight);
        const visibleWidth = Math.max(0, cardRight - cardLeft);
        const visibleRatio = visibleWidth / cardRect.width;

        if (visibleRatio > 0.5 && visibleRatio > maxVisibleRatio) {
          maxVisibleRatio = visibleRatio;
          newActiveIndex = index;
        }
      });
    } else {
      // Desktop: Find the first card that's > 50% visible from the left
      const sortedCards = Array.from(cardRefs.current.entries()).sort(([a], [b]) => a - b);
      
      for (const [index, element] of sortedCards) {
        const cardRect = element.getBoundingClientRect();
        const cardLeft = Math.max(cardRect.left, containerLeft);
        const cardRight = Math.min(cardRect.right, containerRight);
        const visibleWidth = Math.max(0, cardRight - cardLeft);
        const visibleRatio = visibleWidth / cardRect.width;

        if (visibleRatio > 0.5) {
          newActiveIndex = index;
          break; // Take the first one that meets the criteria
        }
      }
    }

    if (newActiveIndex !== activeCardIndex) {
      setActiveCardIndex(newActiveIndex);
    }
  }, [isMobile, activeCardIndex, containerRef]);

  // Set up intersection observer for scroll detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use a simple scroll listener instead of intersection observer for more precise control
    const handleScroll = () => {
      determineActiveCard();
    };

    container.addEventListener('scroll', handleScroll);
    // Also check on resize
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    setTimeout(determineActiveCard, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [determineActiveCard, containerRef]);

  // Re-check when cards are registered/unregistered
  useEffect(() => {
    const timer = setTimeout(determineActiveCard, 100);
    return () => clearTimeout(timer);
  }, [cardRefs.current.size, determineActiveCard]);

  return {
    activeCardIndex,
    registerCard,
    shouldAutoplay: (index: number) => activeCardIndex === index
  };
};