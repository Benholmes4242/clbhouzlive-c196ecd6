import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseHighlightsAutoplayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  highlights: any[];
}

export const useHighlightsAutoplay = ({ containerRef, highlights }: UseHighlightsAutoplayProps) => {
  const isMobile = useIsMobile();
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isContainerVisible, setIsContainerVisible] = useState(true);
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

  // Set up viewport visibility observer for the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.intersectionRatio > 0.5;
        setIsContainerVisible(isVisible);
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [containerRef]);

  // Set up scroll listeners for carousel and page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Handle horizontal scroll within carousel
    const handleScroll = () => {
      determineActiveCard();
    };

    // Handle vertical page scroll
    const handlePageScroll = () => {
      // The intersection observer handles container visibility
      // This just triggers a re-check of active cards
      determineActiveCard();
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handlePageScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    setTimeout(determineActiveCard, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handlePageScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [determineActiveCard, containerRef]);

  // Re-check when cards are registered/unregistered and set initial active card
  useEffect(() => {
    const timer = setTimeout(() => {
      determineActiveCard();
      // If no card is active and we have cards, activate the first one
      if (activeCardIndex === null && cardRefs.current.size > 0) {
        setActiveCardIndex(0);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [cardRefs.current.size, determineActiveCard, activeCardIndex]);

  return {
    activeCardIndex,
    registerCard,
    shouldAutoplay: (index: number) => activeCardIndex === index && isContainerVisible
  };
};