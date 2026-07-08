/**
 * bandwidthMemory — persistent ABR seed for hls.js cold starts.
 *
 * We record the last known hls.js `bandwidthEstimate` (bps) at session end
 * for the FEED-ACTIVE and FULLSCREEN lane classes (rail lanes intentionally
 * excluded — their `startLevel:0` + `capLevelToPlayerSize` profile is what
 * we want for tiny tiles). On engine cold start we seed the ABR EWMA with
 * this value so the first-segment fetch aims at the right rung instead of
 * always starting at the bottom (~600ms cold-start elimination).
 *
 * Storage: single localStorage key, {bw, ts}. Throttled to at most one
 * write per WRITE_THROTTLE_MS to keep writes cheap.
 *
 * Read discipline:
 *   - Clamp to [MIN_BPS, MAX_BPS]
 *   - Ignore samples older than MAX_AGE_MS
 *   - Return null on any parse / storage failure (seed becomes no-op)
 */

const KEY = 'clbhz.bw.estimate';
const WRITE_THROTTLE_MS = 30_000;
const MAX_AGE_MS = 24 * 60 * 60_000;
const MIN_BPS = 300_000;
const MAX_BPS = 20_000_000;

interface Stored { bw: number; ts: number }

let lastWriteTs = 0;

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Read the stored estimate, or null when missing / stale / unparseable. */
export function readSeededBandwidth(): number | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.bw !== 'number' || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null;
    const clamped = Math.max(MIN_BPS, Math.min(MAX_BPS, Math.round(parsed.bw)));
    return clamped;
  } catch {
    return null;
  }
}

/** Persist a new estimate. Throttled — at most one write per 30s. Silent on failure. */
export function writeBandwidthSample(bw: number | null | undefined): void {
  if (!bw || !isFinite(bw) || bw <= 0) return;
  const now = Date.now();
  if (now - lastWriteTs < WRITE_THROTTLE_MS) return;
  const s = safeStorage();
  if (!s) return;
  try {
    const clamped = Math.max(MIN_BPS, Math.min(MAX_BPS, Math.round(bw)));
    s.setItem(KEY, JSON.stringify({ bw: clamped, ts: now } satisfies Stored));
    lastWriteTs = now;
  } catch {
    /* quota / privacy — silent */
  }
}
