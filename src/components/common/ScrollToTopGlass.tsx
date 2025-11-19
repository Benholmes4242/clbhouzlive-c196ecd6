import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    console.log('ScrollToTopGlass mounted');
    
    const onScroll = () => {
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 400;
      console.log('Scroll event:', { scrollY, shouldShow, currentVisible: visible });
      setVisible(shouldShow);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Also check initial position
    onScroll();
    
    return () => {
      console.log('ScrollToTopGlass unmounting');
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  console.log('ScrollToTopGlass render, visible:', visible);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="
        fixed
        bottom-24
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
      "
    >
      <ChevronUp className="h-4 w-4 text-white" />
    </button>
  );
};

export default ScrollToTopGlass;
