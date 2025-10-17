import { useEffect, useRef, useState } from 'react';

export function useActivePostWithHysteresis(cardEls: HTMLElement[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!cardEls.length) return;

    const thresholds = Array.from({length: 21}, (_, i) => i/20); // 0..1 step .05
    const io = new IntersectionObserver((entries) => {
      // Collect ratios by element
      const ratios = new Map<string, number>();
      entries.forEach(e => {
        const el = e.target as HTMLElement;
        const id = el.getAttribute('data-postid')!;
        ratios.set(id, e.intersectionRatio);
      });

      const lastId = lastIdRef.current;
      const lastRatio = lastId ? ratios.get(lastId) ?? 0 : 0;

      // Hysteresis: stick to current until <= 0.45; otherwise pick the > 0.55 best
      let nextId = lastId;
      if (!lastId || lastRatio <= 0.45) {
        let bestId: string | null = null;
        let bestRatio = 0;
        ratios.forEach((r, id) => {
          if (r >= 0.55 && r > bestRatio) { bestId = id; bestRatio = r; }
        });
        if (bestId) nextId = bestId;
      }

      if (nextId !== lastIdRef.current) {
        lastIdRef.current = nextId;
        setActiveId(nextId ?? null);
      }
    }, { root: null, rootMargin: '0px', threshold: thresholds });

    cardEls.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [cardEls]);

  return activeId;
}
