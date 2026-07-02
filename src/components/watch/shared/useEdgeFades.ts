import { useEffect } from 'react';

/**
 * Toggles `data-fade-left` / `data-fade-right` on a wrapper element
 * based on the scroll position of a horizontally-scrolling child.
 * Uses a passive scroll listener + rAF throttle. Cheap overlay gradients
 * on the wrapper composite for free (unlike mask-image on the scroller
 * itself, which WebKit re-invalidates every frame).
 */
export function useEdgeFades(
  scrollerRef: React.RefObject<HTMLElement | null>,
  wrapperRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    const wrapper = wrapperRef.current;
    if (!scroller || !wrapper) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      // Not scrollable → no phantom edges
      if (maxScroll <= 1) {
        wrapper.removeAttribute('data-fade-left');
        wrapper.removeAttribute('data-fade-right');
        return;
      }
      const x = scroller.scrollLeft;
      if (x > 4) wrapper.setAttribute('data-fade-left', '');
      else wrapper.removeAttribute('data-fade-left');
      if (x < maxScroll - 4) wrapper.setAttribute('data-fade-right', '');
      else wrapper.removeAttribute('data-fade-right');
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });

    // Content width can grow (async images / infinite append) — re-check.
    const ro = new ResizeObserver(update);
    ro.observe(scroller);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [scrollerRef, wrapperRef]);
}
