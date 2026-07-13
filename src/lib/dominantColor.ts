/**
 * dominantColor — client-side dominant-colour extraction from an image URL.
 *
 * Loads the image with crossOrigin='anonymous', paints scaled to ~24x24 on an
 * offscreen canvas, and averages the opaque pixels while IGNORING near-white
 * (transparent logo backgrounds) and near-black (outlines). Returns an
 * `rgb(r, g, b)` string, or null on any failure (CORS taint, decode error,
 * empty result).
 *
 * Cached at module scope so each URL is sampled once per session.
 *
 * `darkenTowardCharcoal(rgb, amount=0.4)` mixes the sampled colour toward
 * #14161C so white text + gold accents keep AA contrast on the resulting
 * gradient.
 */

type CacheValue = string | null;
const cache = new Map<string, Promise<CacheValue>>();

const CHARCOAL_R = 0x14;
const CHARCOAL_G = 0x16;
const CHARCOAL_B = 0x1c;

export async function dominantColorFromImage(url: string): Promise<string | null> {
  if (!url) return null;
  const cached = cache.get(url);
  if (cached) return cached;

  const promise = (async (): Promise<CacheValue> => {
    try {
      const img = await loadImage(url);
      const size = 24;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        const pa = data[i + 3];
        if (pa < 200) continue;
        // Reject near-white (logo transparent bg) and near-black (outlines).
        const max = Math.max(pr, pg, pb);
        const min = Math.min(pr, pg, pb);
        if (min > 235) continue;
        if (max < 25) continue;
        r += pr;
        g += pg;
        b += pb;
        count += 1;
      }
      if (count === 0) return null;
      return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
    } catch {
      return null;
    }
  })();

  cache.set(url, promise);
  return promise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Parse an `rgb(r, g, b)` string. Returns null if the input is not a plain rgb().
 */
function parseRgb(s: string): [number, number, number] | null {
  const m = s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Mix an rgb() colour toward charcoal (#14161C). `amount` is 0..1; 0 keeps the
 * source, 1 returns charcoal. Default 0.4 keeps hue readable while ensuring
 * white text + gold accents pass AA contrast.
 */
export function darkenTowardCharcoal(rgb: string, amount = 0.4): string {
  const parsed = parseRgb(rgb);
  if (!parsed) return rgb;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(parsed[0] * (1 - t) + CHARCOAL_R * t);
  const g = Math.round(parsed[1] * (1 - t) + CHARCOAL_G * t);
  const b = Math.round(parsed[2] * (1 - t) + CHARCOAL_B * t);
  return `rgb(${r}, ${g}, ${b})`;
}
