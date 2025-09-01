import { useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragScroll } from '@/hooks/useDragScroll';

export const useCarouselNavigation = (itemCount: number) => {
  const dragRefCallback = useDragScroll({ enabled: true, direction: 'horizontal' });
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

  // Combined ref callback that handles both drag and carousel functionality
  const combinedRefCallback = useCallback((node: HTMLDivElement | null) => {
    carouselRef.current = node;
    dragRefCallback(node);
  }, [dragRefCallback]);

  const updateScrollButtons = () => {
    const container = carouselRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = carouselRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [itemCount]);

  const scroll = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (container) {
      const cardWidth = isMobile ? 212 : 252; // Approximate card width
      const scrollDistance = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollDistance, behavior: 'auto' });
    }
  };

  return {
    carouselRef: combinedRefCallback,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  };
};