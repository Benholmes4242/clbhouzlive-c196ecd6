/** Shared island docking observation. Capture scroll events from #root (and
 * nested scrollers), coalesce reads per frame, and never read window scrollY. */
import { useEffect, useState, type RefObject } from 'react';
import { chromeClearancePx } from './chromeClearance';

export function useDockedStuck(ref: RefObject<HTMLElement>, enabled = true): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const el = ref.current;
      setStuck(!!el && el.getBoundingClientRect().top <= chromeClearancePx() + 1);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
  return enabled && stuck;
}