/**
 * ONE LINE, ALWAYS, WITHOUT TRUNCATING (BRIEF_COURSES_LEAD_HERO §1).
 *
 * The lead hero's course name and place line must hold a single line at any
 * width. Wrapping breaks the card's foot geometry and an ellipsis hides which
 * course it is, so the TYPE SHRINKS instead, down to a floor.
 *
 * ONE MEASURE, ONE WRITE. Set the max, read scrollWidth against clientWidth,
 * scale by the ratio. No loop and no state, so no re-render and no feedback
 * with the observer.
 *
 * THE OBSERVER WATCHES THE PARENT, never the element. Changing font-size
 * changes the element's own height, which would re-fire an observer pointed at
 * it and oscillate.
 */
import { useLayoutEffect, useRef } from 'react';

export function useFitOneLine<T extends HTMLElement>(text: string, max: number, min: number) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.fontSize = `${max}px`;
      const avail = el.clientWidth;
      const needed = el.scrollWidth;
      if (!avail || !needed || needed <= avail) return;
      const scaled = Math.floor(((max * avail) / needed) * 10) / 10;
      el.style.fontSize = `${Math.max(min, scaled)}px`;
    };

    fit();

    const parent = el.parentElement;
    const ro = parent ? new ResizeObserver(fit) : null;
    if (parent && ro) ro.observe(parent);

    /* Web fonts land after first paint and change every measurement. */
    let cancelled = false;
    void document.fonts?.ready.then(() => { if (!cancelled) fit(); });

    return () => { cancelled = true; ro?.disconnect(); };
  }, [text, max, min]);

  return ref;
}
