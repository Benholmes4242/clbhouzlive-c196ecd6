import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const getScrollY = () => {
      if (typeof window === 'undefined') return 0;

      // This is the element that actually scrolls in modern browsers
      const scrollingElement =
        document.scrollingElement || document.documentElement || document.body;

      return (scrollingElement as HTMLElement).scrollTop || 0;
    };

    const handleScroll = () => {
      const y = getScrollY();
      setVisible(y > 400);
    };

    // Run once on mount
    handleScroll();

    // Listen to *document* scroll (captures scroll on inner containers too)
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true } as any);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const scrollingElement =
          document.scrollingElement || document.documentElement || document.body;

        (scrollingElement as HTMLElement).scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }}
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
