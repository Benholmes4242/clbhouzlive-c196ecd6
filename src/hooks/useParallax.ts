import { useEffect, useRef, useState } from 'react';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';


export function useParallax(maxTranslate = 20) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let frameId: number | null = null;

    const handleScroll = () => {
      if (!element) return;
      if (frameId) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || 0;

        // Normalised 0–1 position in viewport
        const progress = Math.min(
          1,
          Math.max(0, (rect.top + rect.height / 2) / windowHeight)
        );

        // Map to -maxTranslate/2 .. +maxTranslate/2
        const translate = (0.5 - progress) * maxTranslate;
        setOffset(translate);
      });
    };

    /* Page scroll happens on #root, so a bubbling window listener never fired
       and the parallax sat still. Listen on the resolved page scroller. */
    const scroller = getPrimaryScrollElement();

    handleScroll();
    scroller?.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      scroller?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };

  }, [maxTranslate]);

  return { ref, offset };
}
