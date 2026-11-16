/**
 * BRIEF_ONE_INDEX_CHART — the one index window (profile, Handicap page, index glance).
 *
 * The series is the index IN FORCE across the last `days` days ending `now`:
 *   - a lead edge point at the window start carrying the last observation at
 *     or before it (when one exists),
 *   - every observation inside (start, now],
 *   - a trail edge point at `now` carrying the newest value.
 * Edge points are not observations and never claim a movement.
 *
 * Net = last minus first; tone reads the same net with DEAD_BAND, so any
 * figure printed beside the chart and the line colour cannot disagree.
 */
import { DEAD_BAND } from '@/components/profile/handicap/whs/charts/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

export const DAY_MS = 86_400_000;
export interface IndexWindowPoint { ts: number; v: number; edge?: 'lead' | 'trail' }
export type IndexWindowDirection = 'down' | 'up' | 'flat';
export interface IndexWindow {
  pts: IndexWindowPoint[]; start: number; end: number; net: number; direction: IndexWindowDirection; tone: string;
  /** FIX_INDEX_WINDOW_PARTIAL_HISTORY: true when history reaches the window start (a lead edge exists). */
  covered: boolean;
  /** Days from the first plotted point to the end, at least 1. */
  spanDays: number;
  days: number;
}

export const INDEX_LEVEL_INK = '#F8FAFC';

export function indexDirection(net: number): IndexWindowDirection {
  return net <= -DEAD_BAND ? 'down' : net >= DEAD_BAND ? 'up' : 'flat';
}
export function indexToneOf(net: number): string {
  const d = indexDirection(net);
  return d === 'down' ? INDEX_DELTA.dark.improved : d === 'up' ? INDEX_DELTA.dark.drifted : INDEX_LEVEL_INK;
}

export function indexWindow(
  history: ReadonlyArray<{ observed_at: string; handicap_index: number | string | null }> | null | undefined,
  days: number,
  now: number = Date.now(),
): IndexWindow {
  const end = now;
  const start = end - days * DAY_MS;
  const all = (history ?? [])
    .map((p) => ({ ts: new Date(p.observed_at).getTime(), v: p.handicap_index == null ? NaN : Number(p.handicap_index) }))
    .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
    .sort((a, b) => a.ts - b.ts);
  const before = all.filter((p) => p.ts <= start);
  const inside = all.filter((p) => p.ts > start && p.ts <= end);
  const pts: IndexWindowPoint[] = [];
  if (before.length) pts.push({ ts: start, v: before[before.length - 1].v, edge: 'lead' });
  pts.push(...inside);
  const last = pts[pts.length - 1];
  if (last && last.ts < end) pts.push({ ts: end, v: last.v, edge: 'trail' });
  const net = pts.length ? pts[pts.length - 1].v - pts[0].v : 0;
  const covered = pts[0]?.edge === 'lead';
  const spanDays = Math.max(1, Math.round((end - (pts[0]?.ts ?? end)) / DAY_MS));
  return { pts, start, end, net, direction: indexDirection(net), tone: indexToneOf(net), covered, spanDays, days };
}

/** Words for a span of days: under 60 → "{n} days" ("1 day"); otherwise "{round(n / 30.4)} months". */
export function daysWord(n: number): string {
  if (n < 60) return n === 1 ? '1 day' : `${n} days`;
  const m = Math.round(n / 30.4);
  return m === 1 ? '1 month' : `${m} months`;
}

/** ONE span label for every caller: the window's own word when covered, else the real span. */
export function windowSpanLabel(w: Pick<IndexWindow, 'covered' | 'spanDays' | 'days'>): string {
  if (w.covered) return w.days >= 365 ? '12 months' : `${w.days} days`;
  return daysWord(w.spanDays);
}
