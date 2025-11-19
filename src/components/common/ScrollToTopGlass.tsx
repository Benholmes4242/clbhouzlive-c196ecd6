import { useEffect, useState, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the actual scrolling container
    const findScrollContainer = (): HTMLElement => {
      // Check common scroll containers
      const candidates = [
        document.querySelector('main'),
        document.querySelector('[data-scroll-container]'),
        document.querySelector('.page-scroll-container'),
        document.querySelector('.scroll-container'),
        document.documentElement,
        document.body,
      ].filter(Boolean) as HTMLElement[];

      // Find the one that's actually scrollable
      for (const el of candidates) {
        const style = window.getComputedStyle(el);
        const hasScroll = style.overflowY === 'auto' || 
                         style.overflowY === 'scroll' || 
                         style.overflow === 'auto' || 
                         style.overflow === 'scroll';
        const canScroll = el.scrollHeight > el.clientHeight;
        
        if (hasScroll || canScroll) {
          console.log('🔝 Found scroll container:', el.tagName, { hasScroll, canScroll, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
          return el;
        }
      }

      // Fallback to documentElement
      return document.documentElement;
    };

    const container = findScrollContainer();
    scrollContainerRef.current = container;

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
