import { useState, useEffect, useRef, useCallback } from 'react';

export const useDynamicBackdropHeight = (activeSection: string) => {
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const updateContentHeight = useCallback(() => {
    if (contentRef.current && activeSection === 'top100') {
      const element = contentRef.current;
      const scrollHeight = element.scrollHeight;
      const offsetHeight = element.offsetHeight;
      const actualHeight = Math.max(scrollHeight, offsetHeight);
      
      // Add extra padding to ensure full coverage
      const dynamicHeight = actualHeight + 200;
      setContentHeight(dynamicHeight);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'top100' && contentRef.current) {
      // Initial height calculation
      updateContentHeight();

      // Set up ResizeObserver to monitor content changes
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Use RAF to avoid layout thrashing
          requestAnimationFrame(() => {
            updateContentHeight();
          });
        }
      });

      observerRef.current.observe(contentRef.current);

      // Also listen for any changes in the DOM
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          updateContentHeight();
        });
      });

      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        mutationObserver.disconnect();
      };
    }
  }, [activeSection, updateContentHeight]);

  // Calculate backdrop height based on content
  const getBackdropHeight = useCallback(() => {
    switch (activeSection) {
      case 'activity': 
        return '1000px';
      case 'top100': 
        return contentHeight > 0 ? `${contentHeight}px` : '200vh';
      case 'handicap': 
        return '1000px';
      default: 
        return '1300px';
    }
  }, [activeSection, contentHeight]);

  return {
    contentRef,
    getBackdropHeight,
    contentHeight
  };
};