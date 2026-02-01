import { useEffect } from 'react';

/**
 * Prevents pull-down overscroll (rubber-band bounce) on iOS and Android.
 * Use on immersive hero pages where the bounce effect looks unpolished.
 */
export function usePreventOverscroll() {
  useEffect(() => {
    // Set overscroll-behavior on body
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    
    // iOS-specific: prevent pull-to-refresh bounce
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // If at top of page and pulling down, prevent the bounce
      if (scrollTop <= 0 && currentY > startY) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.body.style.overscrollBehavior = originalOverscroll;
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}
