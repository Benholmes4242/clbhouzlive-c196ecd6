/**
 * Bulletproof native-app detection for the clbhouz Median wrapper.
 *
 * Layers (in priority order):
 *   1. PERSISTED FLAG — localStorage 'clbhouz_native_confirmed' = '1'. Once we
 *      have EVER observed a native bridge on this install, we treat it as
 *      native forever. Synchronous, cheap, immune to UA quirks.
 *   2. SYNCHRONOUS CHECK — window.median / window.gonative object or UA regex
 *      matching medianapp/gonativeapp/gonative/median/clbhouz-native.
 *      Any positive sets the persisted flag.
 *   3. BOUNDED FIRST-LAUNCH WAIT — done by the caller (RootGate). The bridge
 *      can inject 100-1500ms late on iPad, so callers must hold a neutral
 *      splash for up to ~2s BEFORE deciding "web".
 *
 * IMPORTANT: never render the download gate synchronously before the wait
 * completes. Native must never see the gate.
 */

const FLAG_KEY = 'clbhouz_native_confirmed';

// Hostnames where we always bypass the gate (Lovable preview + local dev).
const BYPASS_HOST_PATTERNS = [
  /(^|\.)lovableproject\.com$/i,
  /(^|\.)lovable\.app$/i,
  /(^|\.)lovable\.dev$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/i,
];

// Native-only UA markers. Keep tight — any legit web browser must NOT match.
const NATIVE_UA_RE = /medianapp|gonativeapp|gonative|median|clbhouz-native/i;

function safeGetFlag(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function safeSetFlag() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** True if window.median or window.gonative is a live object. */
function hasBridgeObject(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(w.median || w.gonative);
}

/** True if the UA contains one of the native markers. */
function hasNativeUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return NATIVE_UA_RE.test(navigator.userAgent || '');
}

/**
 * Synchronous native check. If any signal is present, sets the persisted
 * flag so subsequent launches short-circuit. Never returns true on plain web.
 */
export function isNativeAppSync(): boolean {
  if (safeGetFlag()) return true;
  if (hasBridgeObject() || hasNativeUA()) {
    safeSetFlag();
    return true;
  }
  return false;
}

/** Preview / dev hosts where the gate is always bypassed. */
export function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname ?? '';
  return BYPASS_HOST_PATTERNS.some((re) => re.test(host));
}

/**
 * Wait up to `timeoutMs` for a Median bridge to appear. Resolves true if it
 * does (and persists the flag), false on timeout. Cheap 150ms polling + a
 * one-shot listener on Median's ready callback.
 */
export function waitForNativeBridge(timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (isNativeAppSync()) {
      resolve(true);
      return;
    }

    let settled = false;
    const done = (native: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      try {
        (window as any).median_library_ready = prevReady;
      } catch {
        /* ignore */
      }
      if (native) safeSetFlag();
      resolve(native);
    };

    const prevReady = (window as any).median_library_ready;
    (window as any).median_library_ready = () => {
      try {
        if (typeof prevReady === 'function') prevReady();
      } catch {
        /* ignore */
      }
      done(true);
    };

    const pollId = window.setInterval(() => {
      if (hasBridgeObject() || hasNativeUA()) done(true);
    }, 150);

    const timeoutId = window.setTimeout(() => done(false), timeoutMs);
  });
}
