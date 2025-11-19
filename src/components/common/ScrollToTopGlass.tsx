import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    console.log('🔝 ScrollToTopGlass mounted');
    let rafId: number | null = null;

    const checkScroll = () => {
      // Search through ALL elements to find the one that's actually scrolling
      const allElements = document.querySelectorAll('*');
      let actualScrollContainer: Element | null = null;
      let maxScrollTop = 0;
      
      allElements.forEach((el) => {
        const scrollTop = el.scrollTop;
        if (scrollTop > maxScrollTop) {
          maxScrollTop = scrollTop;
          actualScrollContainer = el;
        }
      });
      
      if (actualScrollContainer && maxScrollTop > 0) {
        console.log('🔝 FOUND ACTUAL SCROLL CONTAINER!', {
          element: actualScrollContainer,
          tagName: actualScrollContainer.tagName,
          className: actualScrollContainer.className,
          scrollTop: maxScrollTop
        });
      }
      
      // On mobile Safari, scrollY might be on window, document.documentElement, or body
      // We need to check all of them during the actual scroll event
      const scrollY = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
        maxScrollTop // Include the actual scroll container's value
      );
      
      console.log('🔝 Scroll detected:', {
        scrollY,
        windowScrollY: window.scrollY,
        pageYOffset: window.pageYOffset,
        docElementTop: document.documentElement?.scrollTop,
        bodyTop: document.body?.scrollTop,
        actualContainerScrollTop: maxScrollTop,
        shouldShow: scrollY > 400
      });
      
      setVisible(scrollY > 400);
    };

    const handleScroll = () => {
      console.log('🔝 Scroll event fired!');
      // Use RAF to throttle and ensure we read the latest scroll position
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(checkScroll);
    };

    // Initial check
    checkScroll();

    // Listen to window scroll - this works on both desktop and mobile
    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('🔝 Window scroll listener added');
    
    // Also try document scroll with capture for good measure
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    console.log('🔝 Document scroll listener added');

    return () => {
      console.log('🔝 ScrollToTopGlass unmounting');
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    // Try multiple scroll targets
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also try these as fallbacks for different browsers
    if (document.documentElement.scrollTo) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (document.body.scrollTo) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
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
