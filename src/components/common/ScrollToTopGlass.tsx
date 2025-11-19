import { useEffect, useState, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the actual scrolling container - with delay to let content load
    const findScrollContainer = (): HTMLElement => {
      console.log('🔝 Searching for scroll container...');
      
      // Check all possible containers and log their scroll state
      const candidates = [
        document.querySelector('main'),
        document.querySelector('[data-scroll-container]'),
        document.querySelector('.page-scroll-container'),
        document.querySelector('.scroll-container'),
        document.documentElement,
        document.body,
      ].filter(Boolean) as HTMLElement[];

      console.log('🔝 Checking', candidates.length, 'candidates');

      // Find ALL scrollable elements and log them
      for (const el of candidates) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflow = style.overflow;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        const canScroll = scrollHeight > clientHeight;
        
        console.log('🔝 Candidate:', el.tagName, {
          overflowY,
          overflow,
          scrollHeight,
          clientHeight,
          canScroll,
          className: el.className
        });
        
        if (canScroll) {
          console.log('🔝 ✅ Selected scroll container:', el.tagName);
          return el;
        }
      }

      console.log('🔝 ⚠️ No scrollable container found, using documentElement');
      return document.documentElement;
    };

    const container = findScrollContainer();
    scrollContainerRef.current = container;
    
    // If no scrollable content found yet, retry after a delay
    if (container.scrollHeight <= container.clientHeight) {
      console.log('🔝 No scrollable content yet, will retry in 1 second...');
      setTimeout(() => {
        const retryContainer = findScrollContainer();
        scrollContainerRef.current = retryContainer;
        retryContainer.addEventListener('scroll', handleScroll, { passive: true });
      }, 1000);
    }

    const checkScroll = () => {
      const scrollTop = container.scrollTop || 0;
      const shouldShow = scrollTop > 400;
      setVisible(shouldShow);
    };

    // Check on mount
    checkScroll();

    // Add scroll listener to the container
    const handleScroll = () => {
      checkScroll();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="
        fixed
        top-3
        left-1/2
        -translate-x-1/2
        z-[80]
        rounded-full
        px-3
        py-2
        flex
        items-center
        justify-center
        glass-dark
        shadow-md
        transition-transform
        active:scale-95
      "
    >
      <ChevronUp className="h-4 w-4 text-white" />
    </button>
  );
};

export default ScrollToTopGlass;
