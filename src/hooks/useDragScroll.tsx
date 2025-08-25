import { useRef, useEffect, useCallback } from 'react';

interface UseDragScrollOptions {
  enabled?: boolean;
  direction?: 'horizontal' | 'vertical' | 'both';
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { enabled = true, direction = 'horizontal' } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const attachEvents = useCallback((element: HTMLDivElement) => {

    const handleMouseDown = (e: MouseEvent) => {
      // Only enable drag on desktop (not on mobile devices)
      if (window.innerWidth < 768) {
        return;
      }
      isDragging.current = true;
      startX.current = e.pageX - element.offsetLeft;
      startY.current = e.pageY - element.offsetTop;
      scrollLeft.current = element.scrollLeft;
      scrollTop.current = element.scrollTop;
      
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      document.body.style.userSelect = 'none';
      
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      e.stopPropagation();
      
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      
      if (direction === 'horizontal' || direction === 'both') {
        const walkX = (x - startX.current) * 2;
        const newScrollLeft = scrollLeft.current - walkX;
        element.scrollLeft = newScrollLeft;
      }
      
      if (direction === 'vertical' || direction === 'both') {
        const walkY = (y - startY.current) * 2;
        element.scrollTop = scrollTop.current - walkY;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
      document.body.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
      document.body.style.userSelect = '';
    };

    // Set initial cursor
    element.style.cursor = 'grab';
    // Set initial cursor and initialize drag scroll

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Event listeners attached

    // Cleanup function
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, direction]);

  // Ref callback that attaches events when element is mounted
  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (elementRef.current) {
      // Cleanup previous element if any
      // Cleanup previous element if any
    }
    
    elementRef.current = node;
    
    if (node && enabled) {
      // Attaching drag events to new element
      attachEvents(node);
    }
  }, [attachEvents, enabled]);

  return refCallback;
};