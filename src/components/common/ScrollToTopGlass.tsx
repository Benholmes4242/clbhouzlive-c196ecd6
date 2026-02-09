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
      
      // Appear after ~1 screen height of scrolling
      setVisible(scrollTop > 600);
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

  return createPortal(
    <div 
      className={`
        fixed
        bottom-[calc(90px+env(safe-area-inset-bottom))]
        right-6
        z-[39]
        transition-all
        duration-300
        ease-out
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scrollToTop();
        }}
        aria-label="Back to top"
        className="
          pointer-events-auto
          h-11
          w-11
          rounded-full
          flex
          items-center
          justify-center
          bg-foreground/80
          backdrop-blur-md
          border
          border-white/15
          shadow-lg
          shadow-black/20
          opacity-80
          hover:opacity-100
          hover:scale-105
          active:scale-95
          transition-all
          duration-150
          touch-manipulation
        "
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <ChevronUp className="h-4 w-4 text-white" />
      </button>
    </div>,
    document.body
  );
};

export default ScrollToTopGlass;
