import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      // Check multiple scroll sources
      const rootContainer = document.getElementById('root');
      const mainElement = document.querySelector('main');
      const pageContainer = document.querySelector('.page-with-header');
      
      const rootScroll = rootContainer?.scrollTop || 0;
      const mainScroll = mainElement?.scrollTop || 0;
      const pageScroll = pageContainer?.scrollTop || 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      
      const scrollTop = Math.max(rootScroll, mainScroll, pageScroll, windowScroll);
      
      // Debug logging
      if (scrollTop > 0) {
        console.log('ScrollToTopGlass scroll detection:', {
          rootScroll,
          mainScroll,
          pageScroll,
          windowScroll,
          maxScroll: scrollTop,
          visible: scrollTop > 400
        });
      }
      
      setVisible(scrollTop > 400);
    };

    // Initial check
    checkScroll();

    // Listen to all possible scroll sources
    const rootContainer = document.getElementById('root');
    const mainElement = document.querySelector('main');
    const pageContainer = document.querySelector('.page-with-header');
    
    if (rootContainer) {
      rootContainer.addEventListener('scroll', checkScroll, { passive: true });
    }
    if (mainElement) {
      mainElement.addEventListener('scroll', checkScroll, { passive: true });
    }
    if (pageContainer) {
      pageContainer.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      if (rootContainer) {
        rootContainer.removeEventListener('scroll', checkScroll);
      }
      if (mainElement) {
        mainElement.removeEventListener('scroll', checkScroll);
      }
      if (pageContainer) {
        pageContainer.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  if (!visible) return null;

  return createPortal(
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="
        fixed
        bottom-24
        right-4
        z-[9999]
        rounded-full
        px-3
        py-2
        flex
        items-center
        justify-center
        glass-dark-no-shadow
        transition-transform
        active:scale-95
      "
    >
      <ChevronUp className="h-4 w-4 text-white" />
    </button>,
    document.body
  );
};

export default ScrollToTopGlass;
