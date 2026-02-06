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
    // Set overscroll-behavior on both html and body for full iOS Safari coverage
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
    };
  }, []);
}
