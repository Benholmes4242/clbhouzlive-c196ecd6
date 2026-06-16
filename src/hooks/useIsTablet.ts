import { useEffect, useState } from 'react';

/**
 * useIsTablet — true when viewport is >= 768px (iPad Mini portrait and up).
 *
 * Use ONLY for components that need JS-level branching (e.g. choosing a
 * Dialog vs a Sheet). Prefer pure CSS (`md:` / `@media (min-width: 768px)`)
 * wherever possible — mobile must remain byte-for-byte unchanged.
 *
 * Breakpoints (matches Tailwind defaults + Stage T-0 contract):
 *   md  768px  — iPad Mini portrait, iPad portrait
 *   lg 1024px  — iPad Air/Pro portrait, iPad Mini landscape
 *   xl 1280px  — iPad Pro landscape
 */
export function useIsTablet(minWidth: number = 768): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    setIsTablet(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [minWidth]);

  return isTablet;
}

export default useIsTablet;
