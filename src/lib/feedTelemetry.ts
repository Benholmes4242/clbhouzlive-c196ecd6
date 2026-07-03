/**
 * Feed telemetry — swipe → poster → first-frame timings.
 *
 * Enable at runtime: localStorage.setItem('FEED_TELEMETRY', '1')
 * Disable:          localStorage.removeItem('FEED_TELEMETRY')
 *
 * Output: compact single-line console.info entries (device LogHud safe).
 * No console.table, no bare object args — every line is a pre-formatted string
 * so the LogHud → COPY path preserves it verbatim.
 *
 * One line per card commit:
 *   [card] #12 img  swipe→vis 4ms  vis→poster 62ms  swipe→ff  -    pool=hit  cached=y
 *   [card] #13 vid  swipe→vis 5ms  vis→poster 71ms  swipe→ff 214ms pool=miss cached=n
 *
 * Summary line after 20 commits (or on flush):
 *   [card] SUMMARY n=20 swipe→ff p50=180ms p95=520ms  poster p50=68ms p95=140ms  poolHit=14/18 cached=6/20
 *
 * Tab-switch and PTR resolve on the next first-frame after their mark:
 *   [card] TAB for-you→friends resolved-in 340ms (via #0)
 *   [card] PTR resolved-in 610ms (via #0)
 */

const FLAG = 'FEED_TELEMETRY';

function on(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

const now = (): number =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

type Kind = 'img' | 'vid' | 'mix' | '?';

interface CardRecord {
  idx: number;
  kind: Kind;
  tSwipe: number;
  tVisible?: number;
  tPoster?: number;
  tFirstFrame?: number;
  poolHit?: boolean;
  cached?: boolean;
  source?: string;
  emitted?: boolean;
}

const cards = new Map<number, CardRecord>();
const swipeFF: number[] = []; // ms
const posterMs: number[] = [];
let poolHitCount = 0;
let poolTotalCount = 0;
let cachedCount = 0;
let cardCount = 0;

let pendingTab: { label: string; t: number } | null = null;
let pendingPTR: { t: number } | null = null;

function pad(n: number | undefined, w = 4): string {
  if (n == null) return '-'.padStart(w, ' ');
  return `${Math.round(n)}ms`.padStart(w + 2, ' ');
}

function pct(arr: number[], p: number): number | undefined {
  if (!arr.length) return undefined;
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

function emit(rec: CardRecord): void {
  if (rec.emitted) return;
  rec.emitted = true;
  const dtVis = rec.tVisible != null ? rec.tVisible - rec.tSwipe : undefined;
  const dtPoster = rec.tVisible != null && rec.tPoster != null ? rec.tPoster - rec.tVisible : undefined;
  const dtFF = rec.tFirstFrame != null ? rec.tFirstFrame - rec.tSwipe : undefined;

  if (dtFF != null) swipeFF.push(dtFF);
  if (dtPoster != null) posterMs.push(dtPoster);
  poolTotalCount += 1;
  if (rec.poolHit) poolHitCount += 1;
  if (rec.cached) cachedCount += 1;
  cardCount += 1;

  const line =
    `[card] #${String(rec.idx).padStart(2, ' ')} ${rec.kind.padEnd(3, ' ')} ` +
    `swipe→vis ${pad(dtVis)}  vis→poster ${pad(dtPoster)}  swipe→ff ${pad(dtFF)}  ` +
    `pool=${rec.poolHit == null ? '-' : rec.poolHit ? 'hit ' : 'miss'} ` +
    `cached=${rec.cached == null ? '-' : rec.cached ? 'y' : 'n'}` +
    (rec.source ? ` src=${rec.source}` : '');
  // eslint-disable-next-line no-console
  console.info(line);

  if (cardCount % 20 === 0) flushSummary();

  // resolve tab / PTR waits on the next first-frame after their mark
  if (dtFF != null && rec.tFirstFrame != null) {
    if (pendingTab && rec.tFirstFrame >= pendingTab.t) {
      const dt = Math.round(rec.tFirstFrame - pendingTab.t);
      // eslint-disable-next-line no-console
      console.info(`[card] TAB ${pendingTab.label} resolved-in ${dt}ms (via #${rec.idx})`);
      pendingTab = null;
    }
    if (pendingPTR && rec.tFirstFrame >= pendingPTR.t) {
      const dt = Math.round(rec.tFirstFrame - pendingPTR.t);
      // eslint-disable-next-line no-console
      console.info(`[card] PTR resolved-in ${dt}ms (via #${rec.idx})`);
      pendingPTR = null;
    }
  }
}

export function flushSummary(): void {
  if (!on()) return;
  const line =
    `[card] SUMMARY n=${cardCount} ` +
    `swipe→ff p50=${pad(pct(swipeFF, 50))} p95=${pad(pct(swipeFF, 95))}  ` +
    `poster p50=${pad(pct(posterMs, 50))} p95=${pad(pct(posterMs, 95))}  ` +
    `poolHit=${poolHitCount}/${poolTotalCount} cached=${cachedCount}/${cardCount}`;
  // eslint-disable-next-line no-console
  console.info(line);
}

/** Fired when the user commits to card `idx` (Virtuoso settles / activeIdx changes). */
export function markSwipe(idx: number, kind: Kind = '?'): void {
  if (!on()) return;
  // flush any prior record we never resolved
  const prior = cards.get(idx);
  if (prior && !prior.emitted && prior.tSwipe) emit(prior);
  cards.set(idx, { idx, kind, tSwipe: now() });
}

/** Fired when the card first hits the intersection threshold (may equal swipe). */
export function markVisible(idx: number): void {
  if (!on()) return;
  const rec = cards.get(idx);
  if (!rec || rec.tVisible != null) return;
  rec.tVisible = now();
}

/** Fired from DecodedImage/LqipUnderlay onDecoded. */
export function markPoster(idx: number): void {
  if (!on()) return;
  const rec = cards.get(idx);
  if (!rec || rec.tPoster != null) return;
  rec.tPoster = now();
  // image-only cards emit here (no first-frame will come)
  if (rec.kind === 'img') {
    // small tick so poster paints have a chance to be measured
    setTimeout(() => emit(rec), 0);
  }
}

/** Fired from SnapVideoPlayer when hasFirstFrame flips true. */
export function markFirstFrame(
  idx: number,
  meta?: { poolHit?: boolean; cached?: boolean; source?: string },
): void {
  if (!on()) return;
  const rec = cards.get(idx);
  if (!rec || rec.tFirstFrame != null) return;
  rec.tFirstFrame = now();
  if (meta) {
    rec.poolHit = meta.poolHit;
    rec.cached = meta.cached;
    rec.source = meta.source;
  }
  if (rec.kind === '?' || rec.kind === 'img') rec.kind = 'vid';
  emit(rec);
}

/** Called from clubhouseStore.setActiveTab. */
export function markTabSwitch(from: string, to: string): void {
  if (!on()) return;
  pendingTab = { label: `${from}→${to}`, t: now() };
}

/** Called from CardFeed onRefresh. */
export function markPTR(): void {
  if (!on()) return;
  pendingPTR = { t: now() };
}
