import { useEffect } from 'react';
import { isPerfEnabled, markContentPainted } from './navTiming';

/** Call from a page root after data is ready and content is mounted. */
export function useContentPainted(ready: boolean = true) {
  useEffect(() => {
    if (!isPerfEnabled() || !ready) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => markContentPainted());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [ready]);
}
