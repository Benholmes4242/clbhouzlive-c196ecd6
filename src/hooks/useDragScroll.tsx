import { useRef, useEffect } from 'react';

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

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only enable drag on desktop (not on mobile devices)
      if (window.innerWidth < 768) return;
      
      isDragging.current = true;
      startX.current = e.pageX - element.offsetLeft;
      startY.current = e.pageY - element.offsetTop;
      scrollLeft.current = element.scrollLeft;
      scrollTop.current = element.scrollTop;
      
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      document.body.style.userSelect = 'none'; // Prevent selection on body too
      
      // Prevent default behaviors
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
        const walkX = (x - startX.current) * 2; // Multiply by 2 for faster scrolling
        element.scrollLeft = scrollLeft.current - walkX;
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
      document.body.style.userSelect = ''; // Restore body selection
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
      document.body.style.userSelect = ''; // Restore body selection
    };

    // Set initial cursor
    element.style.cursor = 'grab';

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, direction]);

  return elementRef;
};