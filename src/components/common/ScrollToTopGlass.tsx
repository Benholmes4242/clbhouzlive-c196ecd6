import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      // Check both #root element scroll and window scroll
      const rootContainer = document.getElementById('root');
      const rootScroll = rootContainer?.scrollTop || 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      
      const scrollTop = Math.max(rootScroll, windowScroll);
      setVisible(scrollTop > 400);
    };

    // Initial check
    checkScroll();

    // Listen to both #root and window scroll events
    const rootContainer = document.getElementById('root');
    if (rootContainer) {
      rootContainer.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      if (rootContainer) {
        rootContainer.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
      }}
      className="
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
    </button>
  );
};

export default ScrollToTopGlass;
