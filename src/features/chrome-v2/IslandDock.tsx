/**
 * IslandDock owns observer-only docking and focused-search force expansion.
 * Callers own the in-flow anchor, both copies' state and tab geometry; the shared
 * dock owns solid-glass paint so future tab surfaces cannot fork that material.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Z } from '@/config/zIndex';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { pushForceExpand } from '@/hooks/useScrollDirection';
import { useIslandsCondensed } from './useIslandsCondensed';
import './island-dock.css';

export function IslandDock({ anchorRef, children }: { anchorRef: RefObject<HTMLElement>; children: (shown: boolean) => ReactNode }) {
  const condensed = useIslandsCondensed();
  const [past, setPast] = useState(false);
  const [focused, setFocused] = useState(false);
  const releaseRef = useRef<(() => void) | null>(null);
  const shown = focused || (past && !condensed);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const sat = getComputedStyle(document.documentElement).getPropertyValue('--sat');
    // Resolve calc/env safely without guessing a device's notch height.
    const probe = document.createElement('div');
    probe.style.height = `calc(${sat.trim() || '0px'} + 56px)`;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const boundary = probe.getBoundingClientRect().height;
    probe.remove();
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? boundary));
    }, { root: getPrimaryScrollElement() ?? null, rootMargin: `-${boundary}px 0px 0px 0px`, threshold: [0, 1] });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

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
    {shown ? children(shown) : null}
  </div>;
}