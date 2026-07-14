/**
 * dominantHeroColor — extract a readability-guardrailed dominant tint from a
 * logo URL, for use as the top stop of the College hero gradient.
 *
 * Guarantees:
 *  - Never rejects (all errors caught -> charcoal fallback).
 *  - Returned tint is dark enough that white text stays readable
 *    (HSL lightness clamped to 0.16..0.28, saturation capped at 0.55).
 *  - Ignores near-white / near-black / near-transparent pixels so a small
 *    accent colour doesn't get drowned out by the logo background.
 */

import { useEffect, useRef, useState } from 'react';
import { CHARCOAL } from '@/features/tourhub/_shared/tokens';

export interface HeroTint {
  tint: string;
  ok: boolean;
}

const FALLBACK: HeroTint = { tint: CHARCOAL, ok: false };

// url -> resolved tint. Prevents re-extraction across mounts / renders.
const CACHE = new Map<string, HeroTint>();
const INFLIGHT = new Map<string, Promise<HeroTint>>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h + 1 / 3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1 / 3) * 255),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}

export async function dominantHeroColor(
  logoUrl: string | null,
): Promise<HeroTint> {
  if (!logoUrl) return FALLBACK;
  const cached = CACHE.get(logoUrl);
  if (cached) return cached;
  const inflight = INFLIGHT.get(logoUrl);
  if (inflight) return inflight;

  const p = (async (): Promise<HeroTint> => {
    try {
      const img = await loadImage(logoUrl);
      const size = 24;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return FALLBACK;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 16) continue;
        if (r > 238 && g > 238 && b > 238) continue;
        if (r < 18 && g < 18 && b < 18) continue;
        rSum += r;
        gSum += g;
        bSum += b;
        count += 1;
      }

      if (count < 8) return FALLBACK;
      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;

      const [h, sRaw, lRaw] = rgbToHsl(rAvg, gAvg, bAvg);
      const s = Math.min(sRaw, 0.55);
      const l = Math.min(0.28, Math.max(0.16, lRaw));
      const [r2, g2, b2] = hslToRgb(h, s, l);
      const result: HeroTint = { tint: toHex(r2, g2, b2), ok: true };
      CACHE.set(logoUrl, result);
      return result;
    } catch {
      CACHE.set(logoUrl, FALLBACK);
      return FALLBACK;
    } finally {
      INFLIGHT.delete(logoUrl);
    }
  })();
  INFLIGHT.set(logoUrl, p);
  return p;
}

/**
 * useHeroTint — resolves the dominant tint for a logo url, memoized by url.
 * Returns CHARCOAL until resolution completes (or on any failure), so the
 * hero background swap is a paint-only change with no layout shift.
 */
export function useHeroTint(logoUrl: string | null): HeroTint {
  const initial: HeroTint = logoUrl ? CACHE.get(logoUrl) ?? FALLBACK : FALLBACK;
  const [tint, setTint] = useState<HeroTint>(initial);
  const lastUrl = useRef<string | null>(logoUrl);

  useEffect(() => {
    lastUrl.current = logoUrl;
    if (!logoUrl) {
      setTint(FALLBACK);
      return;
    }
    const cached = CACHE.get(logoUrl);
    if (cached) {
      setTint(cached);
      return;
    }
    setTint(FALLBACK);
    let cancelled = false;
    dominantHeroColor(logoUrl).then((res) => {
      if (cancelled) return;
      if (lastUrl.current !== logoUrl) return;
      setTint(res);
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  return tint;
}
