import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setVisible(scrollY > 400);
    };

    // Check initial position
    onScroll();
    
    // Add listener to window
    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []); // Empty deps - no stale closure issues

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="
        fixed
        top-3
        left-1/2
        -translate-x-1/2
        z-[60]
        glass-dark
        rounded-full
        px-3
        py-2
        flex
        items-center
        justify-center
        shadow-md
        border border-white/10
        hover:scale-110
        transition-transform
      "
    >
      <ChevronUp className="h-4 w-4 text-white" />
    </button>
  );
};

export default ScrollToTopGlass;
