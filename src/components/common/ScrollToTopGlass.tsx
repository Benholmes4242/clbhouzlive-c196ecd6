import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
          active:scale-95
          transition-transform
          duration-150
          touch-manipulation
        "
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        }}
      >
        <ChevronUp className="h-4 w-4 text-white" />
      </button>
    </div>,
    document.body
  );
};

export default ScrollToTopGlass;
