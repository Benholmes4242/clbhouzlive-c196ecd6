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
      console.log('🖱️ Mouse down detected, window width:', window.innerWidth);
      
      // Only enable drag on desktop (not on mobile devices)
      if (window.innerWidth < 768) {
        console.log('❌ Skipping drag - mobile device');
        return;
      }
      
      console.log('✅ Starting drag operation');
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
      
      console.log('🔄 Mouse move while dragging');
      e.preventDefault();
      e.stopPropagation();
      
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      
      if (direction === 'horizontal' || direction === 'both') {
        const walkX = (x - startX.current) * 2;
        const newScrollLeft = scrollLeft.current - walkX;
        console.log('📐 Horizontal scroll:', { walkX, newScrollLeft, currentScroll: element.scrollLeft });
        element.scrollLeft = newScrollLeft;
      }
      
      if (direction === 'vertical' || direction === 'both') {
        const walkY = (y - startY.current) * 2;
        element.scrollTop = scrollTop.current - walkY;
      }
    };

    const handleMouseUp = () => {
      console.log('🔚 Mouse up - ending drag');
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
      document.body.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      console.log('👋 Mouse leave - ending drag');
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
      document.body.style.userSelect = '';
    };

    // Set initial cursor
    element.style.cursor = 'grab';
    console.log('🎯 Drag scroll initialized for element:', element);

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    console.log('📎 Event listeners attached');

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
      console.log('🧹 Cleaning up previous element');
    }
    
    elementRef.current = node;
    
    if (node && enabled) {
      console.log('🔌 Attaching drag events to new element');
      attachEvents(node);
    }
  }, [attachEvents, enabled]);

  return refCallback;
};