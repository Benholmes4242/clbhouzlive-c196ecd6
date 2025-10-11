import { useEffect, useRef, useCallback } from 'react';

type StartFn = () => void;
type StopFn = () => void;

export function useAutoplayInViewport(
  start: StartFn,
  stop: StopFn,
  rootMargin = '250px'
) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const setNode = useCallback((el: HTMLDivElement | null) => { 
    nodeRef.current = el; 
  }, []);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) start();
        else stop();
      }
    }, { root: null, threshold: 0.25, rootMargin });

    io.observe(el);
    return () => io.disconnect();
  }, [start, stop, rootMargin]);

  return { setNode };
}
