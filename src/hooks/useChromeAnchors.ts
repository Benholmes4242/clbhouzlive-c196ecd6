import { useEffect } from 'react';

/**
 * ⚠️ CRITICAL: Chrome Anchors Synchronization Hook ⚠️
 * 
 * This hook keeps --chrome-top-h and --chrome-bottom-h CSS variables
 * synchronized with the actual chrome element heights.
 * 
 * DO NOT MODIFY without understanding these dependencies:
 * 
 * 1. ClubTagPill (and other .chrome-follow-top elements) rely on --chrome-top-shift
 *    which is calculated from --chrome-top-h in chrome-autohide.css
 * 
 * 2. Setting --chrome-top-h to 0px when header is not found will BREAK all follower
 *    elements (they won't move with the header auto-hide)
 * 
 * 3. The CSS defaults in chrome-autohide.css (64px/96px) MUST be preserved
 *    when elements are not yet mounted or cannot be measured
 * 
 * 4. Race conditions at mount time mean we must conditionally set these variables
 *    ONLY when elements exist, not default to 0
 * 
 * REGRESSION WILL BREAK: Golf club pill sliding, any chrome-follow-top/bottom elements
 * 
 * @see src/styles/chrome-autohide.css
 * @see src/components/clubhouse/ClubTagPill.tsx
 */
export function useChromeAnchors() {
  useEffect(() => {
    const root = document.documentElement;
    
    const setVars = () => {
      // Query for chrome elements by data attributes
      const headerEl = document.querySelector('[data-chrome="header"]') as HTMLElement | null;
      const bottomNavEl = document.querySelector('[data-chrome="bottom-nav"]') as HTMLElement | null;
      
      // Get safe area insets from CSS
      const safeTop = Number.parseInt(getComputedStyle(root).getPropertyValue('--safe-top')) || 0;
      const safeBottom = Number.parseInt(getComputedStyle(root).getPropertyValue('--safe-bottom')) || 0;
      
      // Only set variables when we have elements to measure; otherwise keep previous CSS defaults
      if (headerEl) {
        const headerH = headerEl.getBoundingClientRect().height + safeTop;
        root.style.setProperty('--chrome-top-h', `${Math.round(headerH)}px`);
      }
      if (bottomNavEl) {
        const navH = bottomNavEl.getBoundingClientRect().height + safeBottom;
        root.style.setProperty('--chrome-bottom-h', `${Math.round(navH)}px`);
      }
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
