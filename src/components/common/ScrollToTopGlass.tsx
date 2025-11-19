import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    const checkScroll = () => {
      // On mobile Safari, scrollY might be on window, document.documentElement, or body
      // We need to check all of them during the actual scroll event
      const scrollY = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0
      );
      
      setVisible(scrollY > 400);
    };

    const handleScroll = () => {
      // Use RAF to throttle and ensure we read the latest scroll position
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(checkScroll);
    };

    // Initial check
    checkScroll();

    // Listen to window scroll - this works on both desktop and mobile
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also try document scroll with capture for good measure
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    // Try multiple scroll targets
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also try these as fallbacks for different browsers
    if (document.documentElement.scrollTo) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (document.body.scrollTo) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
