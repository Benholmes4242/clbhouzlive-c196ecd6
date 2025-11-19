import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

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

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('root');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="
        fixed
        top-0.5
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
