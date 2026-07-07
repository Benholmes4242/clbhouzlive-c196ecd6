/**
 * resolveRestingRect — single-sourced geometry for fullscreen media open/close.
 *
 * Ratified product rules (2026-07-07 reconciled brief):
 *   • Portrait/square VIDEO rests COVER (full-bleed, under the notch — Reels rule).
 *     Detection: `mediaAspect <= viewportAspect * 1.05`.
 *   • Landscape VIDEO rests CONTAIN (letterboxed inside the SAFE area — bars clear
 *     the notch / home indicator).
 *   • IMAGES rest CONTAIN always (photos are never cropped by fullscreen chrome;
 *     letterboxed inside the SAFE area).
 *
 * Rationale: every open path used to animate toward the full viewport, then
 * shrink at rest for non-viewport-aspect media. Targeting the resting rect
 * up-front eliminates the overshoot-then-shrink jump.
 *
 * When dims are unknown (0), the full viewport is returned as `fit: 'cover'`
 * so the wrapper visually matches today's behaviour; a caller may re-invoke
 * on `loadedmetadata` and animate a corrective tween.
 */

export interface Viewport {
  w: number;
  h: number;
  safeTop: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
}

export interface RestingRect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** How the media should be object-fit within this rect. */
  fit: 'cover' | 'contain';
}

const VIDEO_COVER_TOLERANCE = 1.05;

export function resolveRestingRect(
  mediaW: number,
  mediaH: number,
  viewport: Viewport,
  mediaType: 'video' | 'image',
): RestingRect {
  // Unknown dims → full viewport, cover. Corrective tween resolves at metadata.
  if (!mediaW || !mediaH) {
    return {
      top: 0,
      left: 0,
      width: viewport.w,
      height: viewport.h,
      fit: 'cover',
    };
  }

  const mediaAspect = mediaW / mediaH;
  const viewportAspect = viewport.w / viewport.h;

  // Portrait/square video → full-bleed cover (Reels rule).
  if (mediaType === 'video' && mediaAspect <= viewportAspect * VIDEO_COVER_TOLERANCE) {
    return {
      top: 0,
      left: 0,
      width: viewport.w,
      height: viewport.h,
      fit: 'cover',
    };
  }

  // CONTAIN branch — centered inside the SAFE area so letterbox bars clear
  // the notch and home indicator.
  const usableW = Math.max(0, viewport.w - viewport.safeLeft - viewport.safeRight);
  const usableH = Math.max(0, viewport.h - viewport.safeTop - viewport.safeBottom);
  const usableAspect = usableW / Math.max(1, usableH);

  let renderW: number;
  let renderH: number;
  if (mediaAspect > usableAspect) {
    renderW = usableW;
    renderH = usableW / mediaAspect;
  } else {
    renderH = usableH;
    renderW = usableH * mediaAspect;
  }

  return {
    top: viewport.safeTop + (usableH - renderH) / 2,
    left: viewport.safeLeft + (usableW - renderW) / 2,
    width: renderW,
    height: renderH,
    fit: 'contain',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe-area inset reader — cached; invalidated on orientationchange / resize.
// ─────────────────────────────────────────────────────────────────────────────

type Insets = Pick<Viewport, 'safeTop' | 'safeBottom' | 'safeLeft' | 'safeRight'>;

let _insetsCache: Insets | null = null;

function readInsetsFresh(): Insets {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { safeTop: 0, safeBottom: 0, safeLeft: 0, safeRight: 0 };
  }
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed',
    'top:env(safe-area-inset-top,0px)',
    'left:env(safe-area-inset-left,0px)',
    'right:env(safe-area-inset-right,0px)',
    'bottom:env(safe-area-inset-bottom,0px)',
    'pointer-events:none',
    'visibility:hidden',
    'width:0',
    'height:0',
  ].join(';');
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const result: Insets = {
    safeTop: parseFloat(cs.top) || 0,
    safeBottom: parseFloat(cs.bottom) || 0,
    safeLeft: parseFloat(cs.left) || 0,
    safeRight: parseFloat(cs.right) || 0,
  };
  document.body.removeChild(el);
  return result;
}

if (typeof window !== 'undefined') {
  const invalidate = () => { _insetsCache = null; };
  window.addEventListener('orientationchange', invalidate);
  window.addEventListener('resize', invalidate);
}

export function readSafeAreaInsets(): Insets {
  if (_insetsCache) return _insetsCache;
  _insetsCache = readInsetsFresh();
  return _insetsCache;
}

/** Convenience: build a Viewport for the current window. */
export function getCurrentViewport(): Viewport {
  const insets = readSafeAreaInsets();
  return {
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
    ...insets,
  };
}
