import { useRef, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragScroll } from '@/hooks/useDragScroll';

export const useCarouselNavigation = (itemCount: number) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragRef = useDragScroll({ enabled: true, direction: 'horizontal' });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

  // Merge refs so both carousel navigation and drag scroll work on the same element
  const mergedRef = (node: HTMLDivElement | null) => {
    carouselRef.current = node;
    if (dragRef.current !== node) {
      (dragRef as any).current = node;
    }
  };

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
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  return {
    carouselRef: mergedRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  };
};