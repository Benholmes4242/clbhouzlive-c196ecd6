import type HlsType from 'hls.js';

let hlsLibPromise: Promise<typeof HlsType | null> | null = null;

/**
 * Eagerly preload hls.js immediately when this module is imported.
 * This eliminates the 3.6s first-load delay by fetching hls.js in parallel
 * with other app initialization, rather than waiting for the first video.
 */
function preloadHlsJs(): void {
  if (typeof window === 'undefined') return;
  if (hlsLibPromise) return; // Already loading/loaded
  
  hlsLibPromise = import('hls.js')
    .then((mod) => {
      console.log(`[${performance.now().toFixed(2)}ms] [HLS] hls.js preloaded successfully`);
      return (mod.default ?? mod) as typeof HlsType;
    })
    .catch((err) => {
      console.error('[HLS] Failed to preload hls.js', err);
      return null;
    });
}

// Start preloading immediately when this module is imported
preloadHlsJs();

/**
 * Load HLS.js via dynamic import (bundled, cached with app code).
 * No external CDN dependency, no script tag injection.
 * 
 * If preload already started, this returns the same promise.
 */
export async function loadHlsJs(): Promise<typeof HlsType | null> {
  // SSR / non-window guard
  if (typeof window === 'undefined') return null;

  // Start loading if not already (fallback, but preload should have already started)
  if (!hlsLibPromise) {
    preloadHlsJs();
  }

  return hlsLibPromise!;
}
