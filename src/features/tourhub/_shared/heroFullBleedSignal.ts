/**
 * heroFullBleedSignal — module-level signal so HybridHero can tell the
 * surrounding TourHubMainPage when it is rendering CinematicHeroFullBleed
 * (live / results). Lets the page lift chrome padding + engage the
 * transparent-chrome overlay without prop-drilling.
 */

import { useEffect, useState } from 'react';

let current = false;
const listeners = new Set<(v: boolean) => void>();

export function setHeroFullBleed(v: boolean) {
  if (current === v) return;
  current = v;
  listeners.forEach((l) => l(v));
}

export function getHeroFullBleed() {
  return current;
}

export function useHeroFullBleed(): boolean {
  const [v, setV] = useState(current);
  useEffect(() => {
    const l = (n: boolean) => setV(n);
    listeners.add(l);
    setV(current);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
