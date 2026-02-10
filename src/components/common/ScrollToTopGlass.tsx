import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const rootContainer = document.getElementById('root');
      const mainElement = document.querySelector('main');
      const pageContainer = document.querySelector('.page-with-header');
      
      const rootScroll = rootContainer?.scrollTop || 0;
      const mainScroll = mainElement?.scrollTop || 0;
      const pageScroll = pageContainer?.scrollTop || 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      
      const scrollTop = Math.max(rootScroll, mainScroll, pageScroll, windowScroll);
      
      setVisible(scrollTop > 400);
    };

    checkScroll();

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
        bottom-24
        right-4
        z-[39]
        transition-all
        duration-200
        ease-out
        ${visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
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
          h-10
          w-10
          rounded-full
          flex
          items-center
          justify-center
          bg-white
          border
          border-gray-100
          shadow-lg
          hover:shadow-xl
          active:scale-95
          transition-all
          duration-150
          touch-manipulation
        "
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <ChevronUp className="h-4 w-4" style={{ color: '#4b5563' }} />
      </button>
    </div>,
    document.body
  );
};

export default ScrollToTopGlass;
