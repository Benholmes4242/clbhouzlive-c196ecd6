import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The actual scroll container is #root (React root element)
    const scrollContainer = document.getElementById('root');
    if (!scrollContainer) return;

    const checkScroll = () => {
      const scrollTop = scrollContainer.scrollTop || 0;
      setVisible(scrollTop > 400);
    };

    // Initial check
    checkScroll();

    // Listen to scroll events on #root
    scrollContainer.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', checkScroll);
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
