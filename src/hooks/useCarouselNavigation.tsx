import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragScroll } from '@/hooks/useDragScroll';

export const useCarouselNavigation = (itemCount: number) => {
  const dragRef = useDragScroll({ enabled: true, direction: 'horizontal' });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

  const updateScrollButtons = () => {
    const container = dragRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = dragRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [itemCount]);

  const scroll = (direction: 'left' | 'right') => {
    const container = dragRef.current;
    if (container) {
      const cardWidth = isMobile ? 212 : 252; // Approximate card width
      const scrollDistance = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  return {
    carouselRef: dragRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  };
};