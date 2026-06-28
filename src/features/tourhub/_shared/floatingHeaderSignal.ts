/**
 * floatingHeaderSignal — fresh, minimal mount/unmount signal for the new
 * FloatingTourHeader. When `true`, the global CompactHeader (rendered via
 * GlobalHeader) should hide itself for the cinematic tour overview surface.
 *
 * Intentionally NOT the old `--tour-hero-overlay` CSS var / `tour-hero-overlay`
 * CustomEvent — that machinery was buggy. This is a tiny standalone store.
 */
import { useEffect, useState } from 'react';

let active = false;
const subs = new Set<(v: boolean) => void>();

export function setFloatingHeaderActive(v: boolean) {
  if (active === v) return;
  active = v;
  subs.forEach((s) => s(v));
}

export function useFloatingHeaderActive(): boolean {
  const [v, setV] = useState<boolean>(active);
  useEffect(() => {
    subs.add(setV);
    setV(active);
    return () => {
      subs.delete(setV);
    };
  }, []);
  return v;
}
