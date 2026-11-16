/**
 * IslandDock owns observer-only docking and focused-search force expansion.
 * Callers own the in-flow anchor, both copies' state and tab geometry; the shared
 * dock owns solid-glass paint so future tab surfaces cannot fork that material.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Z } from '@/config/zIndex';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { pushForceExpand } from '@/hooks/useScrollDirection';
import { useIslandsCondensed } from './useIslandsCondensed';
import './island-dock.css';
import { measureIslandBoundary } from './islandBoundary';

export function IslandDock({ anchorRef, children }: { anchorRef: RefObject<HTMLElement>; children: (shown: boolean) => ReactNode }) {
  const condensed = useIslandsCondensed();
  const [past, setPast] = useState(false);
  const [focused, setFocused] = useState(false);
  const releaseRef = useRef<(() => void) | null>(null);
  const shown = focused || (past && !condensed);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedRef = useRef<HTMLElement | null>(null);

  /* No dependency array: runs after every commit so a replaced anchor (a tab
   * row that unmounts and remounts elsewhere) is re-observed and `past` is
   * recomputed from its rect on the same frame. */
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (anchor === observedRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = null;
    observedRef.current = anchor;
    if (!anchor) { setPast(false); return; }
    const boundary = measureIslandBoundary();
    const rect = anchor.getBoundingClientRect();
    // An anchor with no layout box has not been scrolled past; jsdom and not-yet-laid-out nodes report all-zero rects.
    setPast(!(rect.width === 0 && rect.height === 0) && rect.bottom < boundary);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? boundary));
    }, { root: getPrimaryScrollElement() ?? null, rootMargin: `-${boundary}px 0px 0px 0px`, threshold: [0, 1] });
    observer.observe(anchor);
    observerRef.current = observer;
  });

  useEffect(() => () => { observerRef.current?.disconnect(); observerRef.current = null; observedRef.current = null; }, []);

  useEffect(() => () => { releaseRef.current?.(); releaseRef.current = null; }, []);

  return <div className="island-dock" data-island-dock data-shown={shown} aria-hidden={!shown}
    {...(!shown ? { inert: '' } : {})} style={{ zIndex: Z.header - 1 }}
    onFocusCapture={() => {
      if (!releaseRef.current) releaseRef.current = pushForceExpand();
      setFocused(true);
    }}
    onBlurCapture={(event) => {
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
      releaseRef.current?.(); releaseRef.current = null; setFocused(false);
    }}>
    {children(shown)}
  </div>;
}