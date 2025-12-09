import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to detect scroll direction for hide-on-scroll header behavior
 * Returns isHidden: true when scrolling down, false when scrolling up
 */
export function useScrollDirection(threshold = 8) {
  const [lastY, setLastY] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  const handleScroll = useCallback(() => {
    const y = window.scrollY || 0;
    const delta = y - lastY;

    if (Math.abs(delta) < threshold) return;

    if (delta > 0 && y > 40) {
      // scrolling down past 40px
      setIsHidden(true);
    } else {
      // scrolling up
      setIsHidden(false);
    }

    setLastY(y);
  }, [lastY, threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return { isHidden };
}
