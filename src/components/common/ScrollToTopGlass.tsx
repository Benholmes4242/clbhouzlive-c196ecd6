import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      // Try multiple scroll position sources
      const scrollY = 
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      
      // DEBUG: Log all scroll sources
      console.log('🔝 All scroll values:', {
        'window.scrollY': window.scrollY,
        'window.pageYOffset': window.pageYOffset,
        'document.documentElement.scrollTop': document.documentElement.scrollTop,
        'document.body.scrollTop': document.body.scrollTop,
        'computed': scrollY
      });
      
      const shouldShow = scrollY > 400;
      setVisible(shouldShow);
    };

    // Check on mount
    checkScroll();

    // Add scroll listener with multiple event types
    const handleScroll = () => {
      checkScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Also check on resize (in case layout changes)
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    // Try multiple methods to scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo?.({ top: 0, behavior: 'smooth' });
    document.body.scrollTo?.({ top: 0, behavior: 'smooth' });
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
