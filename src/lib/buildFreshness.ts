/**
 * STALE CLIENT DETECTION
 *
 * A WebView can hold an old index.html indefinitely: it never navigates, so it
 * never re-fetches the document, so it keeps running a build that may have been
 * broken when it shipped. This module gives that client a way to notice.
 *
 * Mechanism: the build emits /build-id.json (fixed path, unhashed, no-store —
 * see vite.config.ts and public/_headers). We compare it to the compile-time
 * __BUILD_ID__ baked into the running bundle.
 *
 * Trigger: `visibilitychange -> visible` only (the dependable background signal
 * in the Median WebView), throttled to once every 30 minutes. NOT an interval,
 * NOT per navigation.
 *
 * We never reload silently — a member mid-round-entry losing input is worse
 * than the bug being fixed. The one exception lives in ErrorBoundary: a
 * dynamic-import failure proves the running bundle is already broken.
 */

const CHECK_INTERVAL_MS = 30 * 60_000;
const DISMISS_KEY = 'clbhouz_update_dismissed_build';

let lastCheck = 0;
let installed = false;
let staleTarget: string | null = null;

type Listener = (staleBuildId: string | null) => void;
const listeners = new Set<Listener>();

export function currentBuildId(): string {
  try {
    return __BUILD_ID__;
  } catch {
    return 'unknown';
  }
}

export function subscribeBuildFreshness(fn: Listener): () => void {
  listeners.add(fn);
  fn(staleTarget);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => {
    try { fn(staleTarget); } catch { /* a listener must not break the check */ }
  });
}

/** Dismissal lasts the session; the check fires again on the next resume. */
export function dismissUpdate(): void {
  try {
    if (staleTarget) sessionStorage.setItem(DISMISS_KEY, staleTarget);
  } catch { /* private mode */ }
  staleTarget = null;
  emit();
}

function isDismissed(buildId: string): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === buildId;
  } catch {
    return false;
  }
}

export async function checkBuildFreshness(force = false): Promise<void> {
  try {
    const now = Date.now();
    if (!force && now - lastCheck < CHECK_INTERVAL_MS) return;
    lastCheck = now;

    const res = await fetch('/build-id.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store' },
    });
    if (!res.ok) return;
    const json = (await res.json()) as { buildId?: string };
    const served = typeof json?.buildId === 'string' ? json.buildId : null;
    if (!served) return;

    if (served !== currentBuildId() && !isDismissed(served)) {
      staleTarget = served;
      emit();
    }
  } catch {
    // Offline or blocked: say nothing. A failed probe is not evidence of
    // staleness and must never surface a bar.
  }
}

export function installBuildFreshnessCheck(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void checkBuildFreshness();
  });
  // Seed the throttle window at boot without a probe: the document we are
  // running was just fetched, so it is current by definition on a cold start.
  lastCheck = Date.now();
}
