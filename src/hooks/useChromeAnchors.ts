import { useEffect } from 'react';

/**
 * Hook to keep --chrome-top-h and --chrome-bottom-h CSS variables
 * synchronized with the actual chrome element heights.
 * Queries elements by data attributes to work across component boundaries.
 */
export function useChromeAnchors() {
  useEffect(() => {
    const root = document.documentElement;
    
    const setVars = () => {
      // Query for chrome elements by data attributes
      const headerEl = document.querySelector('[data-chrome="header"]') as HTMLElement;
      const bottomNavEl = document.querySelector('[data-chrome="bottom-nav"]') as HTMLElement;
      
      // Get safe area insets from CSS
      const safeTop = Number.parseInt(getComputedStyle(root).getPropertyValue('--safe-top')) || 0;
      const safeBottom = Number.parseInt(getComputedStyle(root).getPropertyValue('--safe-bottom')) || 0;
      
      const headerH = (headerEl?.getBoundingClientRect().height ?? 0) + safeTop;
      const navH = (bottomNavEl?.getBoundingClientRect().height ?? 0) + safeBottom;
      
      root.style.setProperty('--chrome-top-h', `${Math.round(headerH)}px`);
      root.style.setProperty('--chrome-bottom-h', `${Math.round(navH)}px`);
    };

    // Initial measurement
    setVars();
    
    // Setup observers for both elements
    const headerEl = document.querySelector('[data-chrome="header"]') as HTMLElement;
    const bottomNavEl = document.querySelector('[data-chrome="bottom-nav"]') as HTMLElement;
    
    const ro1 = headerEl ? new ResizeObserver(setVars) : null;
    const ro2 = bottomNavEl ? new ResizeObserver(setVars) : null;
    
    if (ro1 && headerEl) ro1.observe(headerEl);
    if (ro2 && bottomNavEl) ro2.observe(bottomNavEl);
    
    window.addEventListener('orientationchange', setVars);
    window.addEventListener('resize', setVars);
    
    return () => {
      ro1?.disconnect();
      ro2?.disconnect();
      window.removeEventListener('orientationchange', setVars);
      window.removeEventListener('resize', setVars);
    };
  }, []);
}
