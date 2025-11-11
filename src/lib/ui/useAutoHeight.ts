import { useEffect, useRef, useState } from 'react';

export function useAutoHeight(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<'0px' | 'auto' | `${number}px`>('0px');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isOpen) {
      const measured = el.scrollHeight;
      setHeight(`${measured}px`);
      const id = window.setTimeout(() => setHeight('auto'), 240); // must match CSS duration
      return () => window.clearTimeout(id);
    }

    // closing
    if (height === 'auto') {
      const measured = el.scrollHeight;
      setHeight(`${measured}px`);
      requestAnimationFrame(() => setHeight('0px'));
    } else {
      setHeight('0px');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Re-measure while open when content grows (messages load)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (height !== 'auto') return;
    const ro = new ResizeObserver(() => {
      // brief lock to pixel height and back to auto prevents jump
      el.style.height = `${el.scrollHeight}px`;
      const id = requestAnimationFrame(() => { el.style.height = 'auto'; });
      return () => cancelAnimationFrame(id);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  return { ref, height };
}
