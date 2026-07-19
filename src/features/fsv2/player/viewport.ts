/**
 * Sane-clamped visualViewport reader (v1 defect 2).
 *
 * Median WKWebView can report a degenerate visualViewport (width/height
 * near 0) at the exact moment an overlay mounts. Trust it only when
 * BOTH dimensions clear a 100px floor; otherwise fall back to
 * `window.innerWidth`/`innerHeight`.
 */

import { useEffect, useState } from 'react';

export interface Fsv2Viewport {
  width: number;
  height: number;
  source: 'visualViewport' | 'inner';
}

const CLAMP_FLOOR = 100;

function readNow(): Fsv2Viewport {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, source: 'inner' };
  }
  const vv = window.visualViewport;
  const iw = window.innerWidth || 0;
  const ih = window.innerHeight || 0;
  if (vv && vv.width >= CLAMP_FLOOR && vv.height >= CLAMP_FLOOR) {
    return { width: vv.width, height: vv.height, source: 'visualViewport' };
  }
  return { width: iw, height: ih, source: 'inner' };
}

export function readViewport(): Fsv2Viewport {
  return readNow();
}

export function useFsv2Viewport(): Fsv2Viewport {
  const [vp, setVp] = useState<Fsv2Viewport>(readNow);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setVp(readNow());
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('resize', update);
    // one late-tick re-read in case initial read was poisoned
    const raf = requestAnimationFrame(update);
    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, []);

  return vp;
}
