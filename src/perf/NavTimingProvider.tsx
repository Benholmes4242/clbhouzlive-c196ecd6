import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { beginNav, isPerfEnabled, markInteractive, markNav } from './navTiming';

/**
 * NavTimingProvider — opens a nav transaction on every route change and
 * closes it when the browser goes idle after paint. Mount inside
 * <BrowserRouter>. No-op in production unless ?perf=1.
 */
export function NavTimingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const lastKey = useRef<string>('');

  // Open the transaction SYNCHRONOUSLY during render when the route changes
  // so that child useLayoutEffects (e.g. PageRoot.usePageRootMount) attribute
  // to the new nav rather than the previous one (or null).
  if (isPerfEnabled()) {
    const key = location.pathname + location.search;
    if (key !== lastKey.current) {
      lastKey.current = key;
      beginNav(location.pathname);
    }
  }

  useEffect(() => {
    if (!isPerfEnabled()) return;
    // After the next paint, schedule an idle callback to mark interactive.
    let raf1 = 0;
    let raf2 = 0;
    let idle: any = null;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const w = window as any;
        if (typeof w.requestIdleCallback === 'function') {
          idle = w.requestIdleCallback(() => markInteractive(), { timeout: 2000 });
        } else {
          idle = setTimeout(() => markInteractive(), 200);
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      const w = window as any;
      if (idle && typeof w.cancelIdleCallback === 'function') {
        try { w.cancelIdleCallback(idle); } catch { /* ignore */ }
      } else if (idle) {
        clearTimeout(idle);
      }
    };
  }, [location.pathname, location.search]);

  return children as any;
}


export default NavTimingProvider;
