import { useEffect, useRef, useState } from "react";
import { setActiveVideo } from "../store/activeVideo";

/**
 * Autoplay hook for vertical feed - ensures only one video plays at a time
 * Videos play when they are most in view (highest intersection ratio)
 */
export function useAutoplay<T extends HTMLVideoElement>(threshold = 0.75) {
  const els = useRef<T[]>([]);
  const [active, setActive] = useState<T | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const vid = visible[0].target as T;
          if (active && active !== vid) active.pause();
          setActiveVideo(vid);
          vid.play().catch(() => {});
          setActive(vid);
        }
        entries.forEach((e) => {
          if (!e.isIntersecting) (e.target as T).pause();
        });
      },
      { threshold }
    );
    els.current.forEach((v) => v && obs.observe(v));
    return () => obs.disconnect();
  }, [active, threshold]);

  // Pause when tab hidden
  useEffect(() => {
    const onVis = () => { if (document.hidden && active) active.pause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active]);

  return {
    register: (el: T | null, i: number) => { if (el) els.current[i] = el; },
  };
}
