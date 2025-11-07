import { useEffect, useRef, useState } from "react";
export function useAutoplay<T extends HTMLVideoElement>(threshold = 0.75) {
  const els = useRef<T[]>([]);
  const [active, setActive] = useState<T | null>(null);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if (visible[0]) {
        const v = visible[0].target as T;
        if (active && active !== v) active.pause();
        v.play().catch(()=>{});
        setActive(v);
      }
      entries.forEach(e => { if (!e.isIntersecting) (e.target as T).pause(); });
    }, { threshold });
    els.current.forEach(v => v && obs.observe(v));
    return () => obs.disconnect();
  }, [active, threshold]);
  useEffect(() => {
    const onVis = () => { if (document.hidden && active) active.pause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active]);
  return { register: (el: T | null, i: number) => { if (el) els.current[i] = el; } };
}
