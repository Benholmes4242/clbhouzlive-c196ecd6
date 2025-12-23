import type HlsType from 'hls.js';

let hlsLibPromise: Promise<typeof HlsType | null> | null = null;

/**
 * Load HLS.js via dynamic import (bundled, cached with app code).
 * No external CDN dependency, no script tag injection.
 */
export async function loadHlsJs(): Promise<typeof HlsType | null> {
  // SSR / non-window guard
  if (typeof window === 'undefined') return null;

  if (!hlsLibPromise) {
    hlsLibPromise = import('hls.js')
      .then((mod) => (mod.default ?? mod) as typeof HlsType)
      .catch((err) => {
        console.error('[HLS] Failed to load hls.js', err);
        return null;
      });
  }

  return hlsLibPromise;
}
