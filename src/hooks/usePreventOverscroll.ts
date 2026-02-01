import { useEffect } from 'react';

/**
 * Prevents pull-down overscroll (rubber-band bounce) on iOS and Android.
 * 
 * Uses CSS-only approach via overscroll-behavior which:
 * - ✅ Prevents pull-down bounce at top
 * - ✅ Doesn't interfere with normal scrolling
 * - ✅ No JavaScript event listeners that can block scroll
 * - ✅ Works on modern browsers including iOS Safari
 */
export function usePreventOverscroll() {
  useEffect(() => {
    // Set overscroll-behavior on body - CSS only, no touch event interception
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);
}
