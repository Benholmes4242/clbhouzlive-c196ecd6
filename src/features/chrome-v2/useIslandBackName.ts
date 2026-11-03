/** HB4: hero-name observation only; nav store retains direction/folding ownership. */
import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { measureIslandBoundary } from './islandBoundary';
import { clearIslandBackName, publishIslandBackName } from './islandBackNameStore';

export function useIslandBackName(name: string | null, anchorRef: RefObject<HTMLElement>): void {
  const { pathname } = useLocation();
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!name || !anchor) return;
    const owner = Symbol('island-back-name');
    publishIslandBackName({ owner, pathname, name, past: false });
    const boundary = measureIslandBoundary();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      publishIslandBackName({ owner, pathname, name, past: !entry.isIntersecting && entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? boundary) });
    }, { root: getPrimaryScrollElement() ?? null, rootMargin: `-${boundary}px 0px 0px 0px`, threshold: [0, 1] });
    observer.observe(anchor);
    return () => { observer.disconnect(); clearIslandBackName(owner); };
  }, [name, anchorRef, pathname]);
}