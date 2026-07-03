/**
 * Environment / device detection helpers.
 * Extracted from src/utils/safePlay.ts so playback-free consumers survive
 * the Stage E delete of the video engine.
 */

export const isInWebView =
  typeof navigator !== 'undefined' &&
  /(FBAN|FBAV|Instagram|Line|Messenger|Twitter|TikTok)/i.test(navigator.userAgent);

export const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
