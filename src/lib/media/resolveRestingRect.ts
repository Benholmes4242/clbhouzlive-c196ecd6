/**
 * resolveRestingRect — single-sourced geometry for fullscreen media open/close.
 *
 * SINGLE AUTHORITY for aspect classification in the fullscreen viewer. Every
 * fullscreen media render — clone, borrow slot, settled video slot, settled
 * image, pager pages — MUST consume this function for both `fit` and `rect`.
 * Local aspect heuristics elsewhere are forbidden in fullscreen paths.
 *
 * Aspect definition (this file is the authority — the codebase has both
 * conventions historically): `mediaAspect = width / height`.
 *   Examples: 9:16 portrait = 0.5625, 1:1 square = 1.0, 16:9 landscape = 1.78.
 *
 * Ratified product rules:
 *   • VIDEO with `mediaAspect <= 1.05` (taller-than-wide or square-ish) rests
 *     COVER — full-bleed under the notch (Reels rule). This is an INTRINSIC
 *     media test, not viewport-relative: a 9:16 clip is portrait on any
 *     device and must cover, regardless of the phone's own aspect.
 *   • VIDEO with `mediaAspect > 1.05` (genuinely landscape) rests CONTAIN,
 *     letterboxed inside the SAFE area — bars clear notch / home indicator.
 *   • IMAGES rest CONTAIN always (photos are never cropped by fullscreen).
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

  // Portrait/square VIDEO → full-bleed cover (Reels rule). Intrinsic test:
  // any clip whose width/height is <= 1.05 is portrait-or-square. Viewport
  // aspect is deliberately NOT consulted here — a 9:16 clip must cover on
  // every portrait phone regardless of the phone's exact aspect ratio.
  if (mediaType === 'video' && mediaAspect <= VIDEO_COVER_TOLERANCE) {
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

/** Convenience: build a Viewport for the current window.
 *
 * iOS/WKWebView: window.innerHeight is the layout viewport, which can lag
 * the visible viewport during boot, dynamic-toolbar transitions, and
 * status-bar changes — producing a stale height at the render tick that
 * manifested as the fullscreen "top-pinned sliver". Prefer visualViewport
 * dimensions when available; fall back to innerWidth/innerHeight otherwise.
 */
export function getCurrentViewport(): Viewport {
  const insets = readSafeAreaInsets();
  const hasWin = typeof window !== 'undefined';
  const vv = hasWin ? window.visualViewport : null;
  // Median/WKWebView can report a degenerate visualViewport (height ~0) at
  // overlay-mount tick during body-scroll-lock. Prefer vv only when sane —
  // otherwise fall back to innerWidth/innerHeight so one-shot consumers
  // (image rects, overlay geometry) never size to nothing.
  const vvSane = !!vv && vv.width >= 100 && vv.height >= 100;
  return {
    w: hasWin ? (vvSane ? vv!.width : window.innerWidth) : 0,
    h: hasWin ? (vvSane ? vv!.height : window.innerHeight) : 0,
    ...insets,
  };
}

/** Raw pre-clamp viewport readings for diagnostics. Instrumentation only. */
export function readRawViewportSnapshot() {
  const hasWin = typeof window !== 'undefined';
  const vv = hasWin ? window.visualViewport : null;
  const clamped = getCurrentViewport();
  return {
    vpW: clamped.w,
    vpH: clamped.h,
    innerW: hasWin ? window.innerWidth : 0,
    innerH: hasWin ? window.innerHeight : 0,
    vvW: vv?.width ?? null,
    vvH: vv?.height ?? null,
  };
}
