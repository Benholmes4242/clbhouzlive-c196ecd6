import { useEffect, useRef, useState } from 'react';

export function useVisibilityRatio<T extends Element>(
  opts: IntersectionObserverInit = {}
) {
  const elRef = useRef<T | null>(null);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    if (!elRef.current) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => setRatio(e.intersectionRatio)),
      {
        root: null,
        threshold: Array.from({ length: 21 }, (_, i) => i / 20), // 0..1, step .05
        ...opts,
      }
    );
    io.observe(elRef.current);
    return () => io.disconnect();
  }, []);

  return { ref: elRef, ratio };
}
