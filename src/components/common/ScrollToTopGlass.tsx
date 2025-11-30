import { useEffect, useState, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

interface ScrollToTopGlassProps {
  targetRef?: RefObject<HTMLElement>;
}

const ScrollToTopGlass: React.FC<ScrollToTopGlassProps> = ({ targetRef }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      let scrollTop = 0;
      
      // If targetRef is provided, use it exclusively
      if (targetRef?.current) {
        scrollTop = targetRef.current.scrollTop;
      } else {
        // Fallback to checking multiple scroll sources
        const rootContainer = document.getElementById('root');
        const mainElement = document.querySelector('main');
        const pageContainer = document.querySelector('.page-with-header');
        
        const rootScroll = rootContainer?.scrollTop || 0;
        const mainScroll = mainElement?.scrollTop || 0;
        const pageScroll = pageContainer?.scrollTop || 0;
        const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
        
        scrollTop = Math.max(rootScroll, mainScroll, pageScroll, windowScroll);
      }
      
      setVisible(scrollTop > 400);
    };

    // Initial check
    checkScroll();

    // Listen to scroll events
    if (targetRef?.current) {
      const target = targetRef.current;
      target.addEventListener('scroll', checkScroll, { passive: true });
      return () => {
        target.removeEventListener('scroll', checkScroll);
      };
    } else {
      // Fallback: listen to all possible scroll sources
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
    }
  }, [targetRef]);

  if (!visible) return null;

  const handleClick = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollToTop();
    }
  };

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      className="
        fixed
        top-3
        left-1/2
        -translate-x-1/2
        z-[9999]
        h-9
        w-9
        rounded-full
        flex
        items-center
        justify-center
        glass-dark-no-shadow
        transition-transform
        active:scale-95
      "
    >
      <ChevronUp className="h-5 w-5 text-white" />
    </button>,
    document.body
  );
};

export default ScrollToTopGlass;
