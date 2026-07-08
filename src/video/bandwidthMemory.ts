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
 * Network-awareness (2026-07-08): samples are keyed by CONNECTION CLASS
 * (`navigator.connection.effectiveType`, plus a 'wifi' short-circuit for
 * `connection.type === 'wifi'`). Reads return the sample for the current
 * class ONLY — a wifi seed must not race a cellular cold start into a
 * stall, and vice versa.
 *
 * iOS WebView often omits the Network Information API entirely. In that
 * case class falls back to 'unknown' AND the returned seed is capped at
 * `UNKNOWN_MAX_BPS` (~3 Mbps, a safe 4G-ish ceiling). Asymmetric risk:
 * under-seeding costs one ABR upswitch, over-seeding costs a visible
 * stall — choose the cheap side.
 *
 * Storage: single localStorage key holding a `{ [netClass]: {bw, ts} }`
 * map. Writes throttled at WRITE_THROTTLE_MS per class.
 *
 * Read discipline:
 *   - Clamp to [MIN_BPS, MAX_BPS]
 *   - Additionally clamp to UNKNOWN_MAX_BPS when class is 'unknown'
 *   - Ignore samples older than MAX_AGE_MS
 *   - Return null on any parse / storage failure (seed becomes no-op)
 */

const KEY = 'clbhz.bw.estimate.v2';
const LEGACY_KEY = 'clbhz.bw.estimate';
const WRITE_THROTTLE_MS = 30_000;
const MAX_AGE_MS = 24 * 60 * 60_000;
const MIN_BPS = 300_000;
const MAX_BPS = 20_000_000;
const UNKNOWN_MAX_BPS = 3_000_000;

export type NetClass = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'ethernet' | 'unknown';

interface Sample { bw: number; ts: number }
type Store = Partial<Record<NetClass, Sample>>;

const lastWriteTsByClass: Partial<Record<NetClass, number>> = {};

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Best-effort classification of the current connection. */
export function getNetClass(): NetClass {
  try {
    if (typeof navigator === 'undefined') return 'unknown';
    const c: any = (navigator as any).connection
      ?? (navigator as any).mozConnection
      ?? (navigator as any).webkitConnection;
    if (!c) return 'unknown';
    // `type` (wifi/ethernet/cellular/none) wins when present — a wifi
    // sample is far more predictive of the next wifi session than
    // effectiveType alone.
    const t = typeof c.type === 'string' ? c.type : null;
    if (t === 'wifi') return 'wifi';
    if (t === 'ethernet') return 'ethernet';
    const et = typeof c.effectiveType === 'string' ? c.effectiveType : null;
    if (et === '4g' || et === '3g' || et === '2g' || et === 'slow-2g') return et;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function readStore(s: Storage): Store {
  // v2 (per-class map).
  try {
    const raw = s.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Store;
    }
  } catch { /* fall through */ }
  // Legacy migration: single `{bw, ts}` sample → attribute to '4g' as a
  // reasonable default and delete the old key.
  try {
    const legacy = s.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      s.removeItem(LEGACY_KEY);
      if (parsed && typeof parsed.bw === 'number' && typeof parsed.ts === 'number') {
        return { '4g': { bw: parsed.bw, ts: parsed.ts } };
      }
    }
  } catch { /* ignore */ }
  return {};
}

function writeStore(s: Storage, store: Store): void {
  try { s.setItem(KEY, JSON.stringify(store)); } catch { /* quota — silent */ }
}

/**
 * Read the stored estimate for the CURRENT network class, or null when
 * missing / stale / unparseable. When class is 'unknown', clamp to
 * UNKNOWN_MAX_BPS.
 */
export function readSeededBandwidth(): number | null {
  const s = safeStorage();
  if (!s) return null;
  const store = readStore(s);
  const cls = getNetClass();
  const sample = store[cls];
  if (!sample || typeof sample.bw !== 'number' || typeof sample.ts !== 'number') return null;
  if (Date.now() - sample.ts > MAX_AGE_MS) return null;
  const ceiling = cls === 'unknown' ? UNKNOWN_MAX_BPS : MAX_BPS;
  return Math.max(MIN_BPS, Math.min(ceiling, Math.round(sample.bw)));
}

/**
 * Persist a new estimate for the CURRENT class. Throttled per-class —
 * at most one write per WRITE_THROTTLE_MS per class. Silent on failure.
 */
export function writeBandwidthSample(bw: number | null | undefined): void {
  if (!bw || !isFinite(bw) || bw <= 0) return;
  const cls = getNetClass();
  const now = Date.now();
  const last = lastWriteTsByClass[cls] ?? 0;
  if (now - last < WRITE_THROTTLE_MS) return;
  const s = safeStorage();
  if (!s) return;
  const clamped = Math.max(MIN_BPS, Math.min(MAX_BPS, Math.round(bw)));
  const store = readStore(s);
  store[cls] = { bw: clamped, ts: now };
  writeStore(s, store);
  lastWriteTsByClass[cls] = now;
}
