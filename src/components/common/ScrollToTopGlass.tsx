import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after modest scroll so it appears on phones
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
