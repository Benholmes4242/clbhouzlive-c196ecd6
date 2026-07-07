import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    median_library_ready?: () => void;
    gonative_library_ready?: () => void;
  }
}

// Global shield element reference — set once, never cleared
const getShield = (): HTMLElement | null =>
  document.getElementById('safe-area-shield');

// Single source of truth for current status bar color
export let currentShieldColor = '#000000';

// Module-level flag: has the Median native bridge fired its ready callback yet?
// Used to gate the 250/750ms failsafe retries — they exist purely to cover the
// cold-start race where the bridge isn't up at first paint. Once ready, the
// retries are pure overhead that cause a visible ~250ms repaint after every
// SPA navigation, so we skip them.
let medianLibraryReady = false;

function getNativeBridge(): any | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.median || w.gonative || w.gonern || null;
}

function isNativeStatusBarShell(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return Boolean(getNativeBridge()) || /medianapp|gonativeapp|median|gonative/.test(ua);
}

function maybeNativeStatusBarShell(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod|medianapp|gonativeapp|median|gonative/.test(ua) || Boolean(getNativeBridge());
}

function invokeNativeProtocol(path: string, params: Record<string, string | boolean>): void {
  if (typeof document === 'undefined') return;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const w = window as any;
  const ua = (navigator.userAgent || '').toLowerCase();
  const scheme = w.gonative || w.gonern || ua.includes('gonative') ? 'gonative' : 'median';
  const url = `${scheme}://${path}?${search.toString()}`;

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.style.display = 'none';
    anchor.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => anchor.remove(), 1000);
  } catch {
    try { window.location.href = url; } catch {}
  }
}

let overlayRetryTimer: ReturnType<typeof setTimeout> | null = null;
let overlayRetryCount = 0;

function scheduleOverlayBootRetry(): void {
  if (statusBarOverlayBooted || overlayRetryTimer || !maybeNativeStatusBarShell()) return;
  if (overlayRetryCount >= 16) return;
  overlayRetryTimer = setTimeout(() => {
    overlayRetryTimer = null;
    overlayRetryCount += 1;
    ensureStatusBarOverlayBooted();
  }, overlayRetryCount < 4 ? 125 : 500);
}

export function applyShieldColor(color: string) {
  currentShieldColor = color;
  const shield = getShield();
  if (shield) shield.style.backgroundColor = color;
}

/**
 * Reset shield to transparent — called on every route change as a baseline.
 * Individual page hooks then opt-in to their own color on top.
 */
export function resetShieldToTransparent() {
  applyShieldColor('transparent');
}

function toAARRGGBB(hex: string) {
  if (hex.toLowerCase() === 'transparent') return '00000000';
  const clean = hex.replace('#', '').trim();
  if (clean.length === 8) return clean.toUpperCase();
  if (clean.length !== 6) return 'FF000000';
  return `FF${clean.toUpperCase()}`;
}

/**
 * Translate PageRoot's *intent* into the value Median's native bridge expects.
 *
 * PageRoot semantics (what callers pass):
 *   'dark'  → caller wants DARK icons (light background)
 *   'light' → caller wants LIGHT/white icons (dark background)
 *   'auto'  → leave to Median
 *
 * Empirically Median's `statusbar.set({ style })` is inverted vs. that intent
 * on iOS — passing 'dark' produces WHITE icons (dark status-bar theme) and
 * vice versa. Flip once, at the single mapping point, so every caller's
 * intent renders correctly on device. Do not flip 'auto'.
 */
function toMedianStyle(intent: string): string {
  if (intent === 'dark') return 'light';   // dark icons → Median 'light' theme
  if (intent === 'light') return 'dark';   // white icons → Median 'dark' theme
  return intent;                            // 'auto' passes through untouched
}

/**
 * Boot-time overlay lock (fs.open jolt fix — 2026-07-07).
 *
 * The Median native bridge resizes the WebView viewport when the `overlay`
 * flag on `statusbar.set` flips. That resize lands ASYNC (30–80ms after the
 * call) and, when it happened mid-animation on the fs.open path, caused the
 * feed's 100dvh slides to re-lay-out inside the expanding wrapper — visible
 * as a "jump + resize" jolt.
 *
 * Fix: fire `overlay:true` ONCE at app boot with a neutral transparent tint.
 * Every subsequent status-bar update MUST pass style + color only (never the
 * `overlay` key). With the flag never changing again, the viewport is stable
 * across route transitions and overlay opens, and the SnapFeed 100dvh
 * height stops re-resolving mid-transition.
 */
let statusBarOverlayBooted = false;
let lastStatusBarRequest: { intent: 'light' | 'dark' | 'auto'; hexColor: string } | null = null;
export function ensureStatusBarOverlayBooted(): void {
  if (statusBarOverlayBooted) return;
  if (typeof window === 'undefined') return;

  // Native shell detection must match the rest of the app: Median iOS builds
  // can identify as GoNative and/or expose the bridge before the UA contains
  // "median". The previous `ua.includes('median')` gate marked overlay as
  // booted on GoNative shells without ever sending `overlay:true`, leaving the
  // WebView inset below the native grey/white status bar on immersive pages.
  if (!isNativeStatusBarShell()) {
    // Do NOT mark booted here. On some Median/GoNative iOS builds the UA marker
    // and bridge arrive after module evaluation; marking booted early means the
    // later ready callback returns without ever sending overlay:true, leaving the
    // WebView permanently inset below the native status bar.
    scheduleOverlayBootRetry();
    return;
  }

  try {
    // style/color here are throwaway — they get overwritten immediately by
    // the first route/overlay setStyleColor call. What matters is overlay:true.
    const bridge = getNativeBridge();
    if (bridge?.statusbar?.set) {
      bridge.statusbar.set({
        style: 'light',
        color: '00000000',
        overlay: true,
        blur: false,
      });
      statusBarOverlayBooted = true;
      overlayRetryCount = 0;
      if (lastStatusBarRequest) {
        (bridge.statusbar.set as (opts: Record<string, unknown>) => void)({
          style: toMedianStyle(lastStatusBarRequest.intent),
          color: toAARRGGBB(lastStatusBarRequest.hexColor),
        });
      }
    } else {
      invokeNativeProtocol('statusbar/set', {
        style: 'light',
        color: '00000000',
        overlay: true,
        blur: false,
      });
    }
  } catch {
    // Bridge not ready — the ready callback below retries.
    invokeNativeProtocol('statusbar/set', {
      style: 'light',
      color: '00000000',
      overlay: true,
      blur: false,
    });
  }

  if (!statusBarOverlayBooted) scheduleOverlayBootRetry();
}

/**
 * Style/color-only setter — never touches the `overlay` flag. All non-boot
 * status-bar call sites (App route effect, openWithOrigin, FullscreenFeedOverlay)
 * must go through this helper so the boot-locked overlay flag is preserved.
 */
export function setStatusBarStyleColor(intent: 'light' | 'dark' | 'auto', hexColor: string): void {
  if (typeof window === 'undefined') return;
  lastStatusBarRequest = { intent, hexColor };
  if (!isNativeStatusBarShell()) return;
  try {
    const bridge = getNativeBridge();
    if (bridge?.statusbar?.set) {
      // Deliberately omit `overlay`/`blur` — boot-locked, must not be re-sent.
      (bridge.statusbar.set as (opts: Record<string, unknown>) => void)({
        style: toMedianStyle(intent),
        color: toAARRGGBB(hexColor),
      });
    } else {
      invokeNativeProtocol('statusbar/set', {
        style: toMedianStyle(intent),
        color: toAARRGGBB(hexColor),
      });
      scheduleOverlayBootRetry();
    }
  } catch {
    // Bridge not ready — silent no-op.
    invokeNativeProtocol('statusbar/set', {
      style: toMedianStyle(intent),
      color: toAARRGGBB(hexColor),
    });
    scheduleOverlayBootRetry();
  }
}

// Kick a boot-attempt at module load, then again on the Median ready callback.
if (typeof window !== 'undefined') {
  ensureStatusBarOverlayBooted();
  const prev = window.median_library_ready;
  window.median_library_ready = () => {
    if (typeof prev === 'function') prev();
    ensureStatusBarOverlayBooted();
  };
  const prevGoNative = window.gonative_library_ready;
  window.gonative_library_ready = () => {
    if (typeof prevGoNative === 'function') prevGoNative();
    ensureStatusBarOverlayBooted();
  };
}

function applyMedianStatusBar(style: string, hexColor: string, _overlay: boolean, _blur: boolean) {
  // Overlay/blur flags are boot-locked (see ensureStatusBarOverlayBooted).
  // This legacy path is retained for the useMedianStatusBar hook signature
  // but now only forwards style + color.
  setStatusBarStyleColor(style as 'light' | 'dark' | 'auto', hexColor);
}

/**
 * useMedianStatusBar — manages Median.co status bar + persistent safe-area shield.
 *
 * CRITICAL: The cleanup function intentionally does NOT reset html/body/shield
 * backgrounds. The next hook invocation overwrites them. Resetting to '' was the
 * root cause of the grey flash on app resume.
 */
export function useMedianStatusBar(
  style: 'light' | 'dark' | 'auto',
  hexColor: string,
  overlay = false,
  blur = false,
  enabled = true,
  /** Optional key — when this changes, the effect re-fires.
   * Pass location.pathname for keep-alive pages (e.g. Clubhouse)
   * so the status bar is re-applied on every navigation back. */
  reapplyKey?: string | number,
  /** Route-scope: if set, apply() bails when window.location.pathname
   * does not match. Prevents keep-alive pages from re-asserting chrome
   * while the user is on a different route. */
  ownerPath?: string | ((path: string) => boolean),
) {
  const configRef = useRef({ style, hexColor, overlay, blur, enabled });
  configRef.current = { style, hexColor, overlay, blur, enabled };
  const ownerRef = useRef(ownerPath);
  ownerRef.current = ownerPath;


  useEffect(() => {
    if (!enabled) return;

    const apply = () => {
      const c = configRef.current;
      if (!c.enabled) return;

      // Route-scope guard: bail if this hook does not own the current route.
      const owner = ownerRef.current;
      const path = window.location.pathname;
      const matches = !owner || (typeof owner === 'function' ? owner(path) : owner === path);
      if (owner && !matches) return;

      const color = c.hexColor === 'transparent' ? 'transparent' : (c.hexColor || '#000000');


      // 1. Update the persistent shield — this NEVER gets cleaned up
      applyShieldColor(color);

      // 2. Update Median native status bar
      applyMedianStatusBar(c.style, c.hexColor, c.overlay, c.blur);

      // 3. Belt + suspenders: paint html/body to match (iOS WebView compositing)
      const paintColor = color === 'transparent' ? '#000000' : color;
      document.documentElement.style.backgroundColor = paintColor;
      document.body.style.backgroundColor = paintColor;

      // 4. Update theme-color meta for iOS
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', color);
      }
    };

    // Apply immediately
    apply();

    // Register Median's async ready callback. Flip the module flag so future
    // hook invocations know the bridge is up and can skip the failsafe retries.
    const prev = window.median_library_ready;
    window.median_library_ready = () => {
      medianLibraryReady = true;
      if (typeof prev === 'function') prev();
      apply();
    };

    // Failsafe retries — ONLY when the Median bridge hasn't reported ready yet.
    // Cold-start needs them (bridge may come up after first paint); warm SPA
    // navs don't, and running them there caused a visible ~250ms repaint tail.
    const t1 = !medianLibraryReady ? setTimeout(apply, 250) : null;
    const t2 = !medianLibraryReady ? setTimeout(apply, 750) : null;


    // Re-apply on visibility restore (single retry is sufficient)
    const handleVisibility = () => {
      if (!document.hidden) {
        apply();
        setTimeout(apply, 200);
      }
    };

    // Re-apply on focus (desktop fallback — visibilitychange handles iOS)
    const handleFocus = () => {
      if (document.hidden) return; // skip if visibility handler will fire
      apply();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);

      // ⚠️ CRITICAL: Do NOT reset html/body/shield backgrounds on cleanup.
      // The next page's useMedianStatusBar will overwrite them when it mounts.
      // Resetting to '' causes the grey flash — we never do this.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reapplyKey]); // reapplyKey allows keep-alive pages to force re-apply on nav
}
