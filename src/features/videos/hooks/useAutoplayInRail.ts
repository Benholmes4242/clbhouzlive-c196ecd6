import { useEffect, useRef } from "react";

/**
 * Autoplay hook for horizontal rails (like Shorts carousel)
 * Only plays videos when they are in view within the rail container
 */
export function useAutoplayInRail<T extends HTMLVideoElement>(
  railRef: React.RefObject<HTMLElement>,
  threshold = 0.95
) {
  const vids = useRef<T[]>([]);

  useEffect(() => {
    if (!railRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as T;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { root: railRef.current, threshold }
    );
    vids.current.forEach((v) => v && obs.observe(v));
    return () => obs.disconnect();
  }, [railRef, threshold]);

  return { register: (el: T | null, i: number) => { if (el) vids.current[i] = el; } };
}
