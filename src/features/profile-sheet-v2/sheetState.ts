/**
 * ProfileSheetV2 — the sheet's ONE handicap state machine and its pure readers.
 *
 * BRIEF_PROFILE_SHEET_REBUILD S.4: this IS `analyticsState`, extended. The old
 * 'ready' | 'building' | 'disconnected' triple lived in ProfileSheetV2 and only
 * SheetNavGroup's Course analytics row read it; that row is gone (E.5), so the
 * triple is replaced by this richer union rather than kept beside it. Do not
 * add a second state machine next to this one.
 *
 * S.1: the choice between eg_handicap_index and manual_handicap_index is made
 * by resolveDisplayHandicap and nowhere here. A connection with no synced
 * index is UNKNOWN (syncing / failing), never the manual figure.
 */
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';

export type SheetHcpState =
  | { kind: 'unsettled' }
  | { kind: 'business' }
  | { kind: 'hidden' }
  | { kind: 'none' }
  | { kind: 'manual'; index: number }
  | { kind: 'syncing'; body: string }
  | { kind: 'failing'; body: string; lastSyncedAt: string | null }
  | { kind: 'ready'; index: number };

export interface SheetConnectionLike {
  provider?: string | null;
  last_sync_status?: string | null;
  last_sync_error?: string | null;
  last_synced_at?: string | null;
}

export interface DeriveSheetStateInput {
  isBusiness: boolean;
  settled: boolean;
  hidden: boolean;
  connection: SheetConnectionLike | null;
  egHandicapIndex: number | null | undefined;
  manualHandicapIndex: number | null | undefined;
  /** The trend's current figure: the synced index's fallback when eg_handicap_index is absent. */
  trendCurrent?: number | null;
}

/**
 * EVERY FAILURE VALUE THE SYNC WRITERS SET on whs_connections.last_sync_status,
 * matched exactly — never a pattern. Writers: sync-whs-due markFailure
 * (auth_failed | rate_limited | transient_error | unknown_error), its unhandled
 * catch (timeout | failed), sync-whs-one (auth_failed). Healthy values are ok,
 * partial and null (connect-whs). A value not in this set is not failing by
 * status; last_sync_error still marks it.
 */
export const FAILING_SYNC_STATUSES: ReadonlySet<string> = new Set([
  'auth_failed', 'rate_limited', 'transient_error', 'unknown_error', 'timeout', 'failed',
]);

export function isSyncFailing(c: SheetConnectionLike): boolean {
  if (c.last_sync_error != null) return true;
  return c.last_sync_status != null && FAILING_SYNC_STATUSES.has(c.last_sync_status);
}

/** The two doors go to two places: rounds to the profile Rounds tab, index to handicap. */
export const ROUNDS_DOOR_ROUTE = '/profile?tab=rounds';
export const INDEX_DOOR_ROUTE = '/handicap';

export function deriveSheetHcpState(i: DeriveSheetStateInput): SheetHcpState {
  if (i.isBusiness) return { kind: 'business' };
  // S.3 UNRESOLVED IS NOT ABSENT — never flash a connect card at a connected member.
  if (!i.settled) return { kind: 'unsettled' };
  // S.2(a) — the member switched this off. Nothing replaces it, not even a prompt.
  if (i.hidden) return { kind: 'hidden' };
  const r = resolveDisplayHandicap({
    // eg_handicap_index, else the trend's current figure — both are the
    // federation's number; the resolver still makes the only choice.
    egHandicapIndex: i.egHandicapIndex ?? i.trendCurrent ?? null,
    manualHandicapIndex: i.manualHandicapIndex,
    hasWhsConnection: !!i.connection,
  });
  if (r.source === 'none') return { kind: 'none' };
  if (r.source === 'manual') return { kind: 'manual', index: r.value as number };
  const c = i.connection as SheetConnectionLike;
  if (r.value == null) {
    const body = bodyNameForProvider(c.provider);
    return isSyncFailing(c)
      ? { kind: 'failing', body, lastSyncedAt: c.last_synced_at ?? null }
      : { kind: 'syncing', body };
  }
  return { kind: 'ready', index: r.value };
}

/** The index the sheet prints for a member, or null. */
export function sheetIndex(s: SheetHcpState): number | null {
  return s.kind === 'manual' || s.kind === 'ready' ? s.index : null;
}

export function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

/** Signed one-decimal figure. True minus U+2212, never a hyphen. */
export function fmtSigned(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(1)}`;
  if (r > 0) return `+${r.toFixed(1)}`;
  return '0.0';
}

// ─── A. identity second line ────────────────────────────────────────────────
export function identityLine(a: { isBusiness: boolean; club: string | null | undefined; index: number | null }): string | null {
  if (a.isBusiness) return 'Business profile';
  const club = a.club?.trim() || null;
  const idx = a.index != null ? formatIndex(a.index) : null;
  // V3 A.2: with a club, the club alone — card C states the index directly below.
  if (club) return club;
  if (idx) return `Playing off ${idx}`;
  return null;
}

// ─── C. the handicap sentence ───────────────────────────────────────────────
export interface Seg { text: string; bold?: boolean }
export interface SeriesPoint { t: string; v: number }

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * C.1 — every clause reads the SAME series the chart draws. A clause the series
 * cannot support is DROPPED, never softened. No clause → null.
 */
export function handicapSentence(points: SeriesPoint[], windowDays: 30 | 90, now: Date = new Date()): Seg[] | null {
  const n = points.length;
  if (n < 2) return null;
  const first = r1(points[0].v);
  const last = r1(points[n - 1].v);
  const span = windowDays === 90 ? 'ninety days' : 'thirty days';
  const d = r1(last - first);
  const segs: Seg[] = [];

  if (d === 0) segs.push({ text: `Level over ${span}` });
  else segs.push({ text: d < 0 ? 'Down ' : 'Up ' }, { text: Math.abs(d).toFixed(1), bold: true }, { text: ` in ${span}` });

  // The high: only when it sits above where the member is now.
  let hiI = 0;
  points.forEach((p, i) => { if (p.v > points[hiI].v) hiI = i; });
  const high = r1(points[hiI].v);
  if (high > last) {
    const hd = new Date(points[hiI].t);
    const month = hd.toLocaleDateString(undefined, hd.getFullYear() === now.getFullYear()
      ? { month: 'long' } : { month: 'long', year: 'numeric' });
    segs.push({ text: ', from a high of ' }, { text: formatIndex(high), bold: true }, { text: ` in ${month}` });
  }
  segs.push({ text: '.' });

  // The low, relative to now.
  let loI = 0;
  points.forEach((p, i) => { if (p.v < points[loI].v) loI = i; });
  const low = r1(points[loI].v);
  if (low < last) {
    segs.push({ text: ' Your lowest was ' }, { text: formatIndex(low), bold: true },
      { text: `, on ${playDateStandalone(points[loI].t, undefined, now)}.` });
  } else if (low === last && last < first) {
    segs.push({ text: ' This is your lowest in the window.' });
  }
  return segs;
}

// ─── D. your form ───────────────────────────────────────────────────────────
export interface FormScoreLike {
  id: string;
  play_date: string;
  handicap_differential: number | null;
  /** The index this round was PLAYED OFF (see WhsScore, D.2). */
  handicap_index_at_time: number | null;
  is_nine_hole: boolean;
}
export interface FormBar {
  id: string;
  date: string;
  /** Differential minus the index played off — the bar's SIDE and height. */
  value: number;
  /** The index movement attributed to this round — the bar's TONE. Null when unknown. */
  movement: number | null;
}

/**
 * D.1 — differential minus the index played off, both from the SAME row.
 * Input may be in any order; output is the last five, oldest first. Nine-hole
 * rounds are excluded (D.6).
 *
 * V3 D.4/D.5 — MOVEMENT IS AN ATTRIBUTION, NOT A CERTIFICATE. A round's movement
 * is the index the NEXT round (by play_date) was played off minus the index this
 * round was played off; for the most recent round, the member's CURRENT index
 * minus that. A WHS revision or a course re-rating also moves an index, so a rare
 * round is coloured by a movement it did not cause. Accepted; never read the
 * figure as exact.
 */
export function formBars(scores: FormScoreLike[] | null | undefined, currentIndex: number | null = null): FormBar[] {
  if (!scores) return [];
  const chain = scores
    .filter((s) => s.handicap_index_at_time != null)
    .slice()
    .sort((a, b) => (a.play_date < b.play_date ? -1 : a.play_date > b.play_date ? 1 : 0));
  const movementOf = (id: string): number | null => {
    const i = chain.findIndex((s) => s.id === id);
    if (i < 0) return null;
    const from = Number(chain[i].handicap_index_at_time);
    const to = i + 1 < chain.length ? Number(chain[i + 1].handicap_index_at_time) : currentIndex;
    return to == null ? null : r1(to - from);
  };
  return scores
    .filter((s) => !s.is_nine_hole && s.handicap_differential != null && s.handicap_index_at_time != null)
    .slice()
    .sort((a, b) => (a.play_date < b.play_date ? 1 : a.play_date > b.play_date ? -1 : 0))
    .slice(0, 5)
    .reverse()
    .map((s) => ({
      id: s.id,
      date: s.play_date,
      value: r1(Number(s.handicap_differential) - Number(s.handicap_index_at_time)),
      movement: movementOf(s.id),
    }));
}

/** V3 D.3 — green when the round lowered the index, whichever side the bar sits. */
export function formBarLowered(b: FormBar): boolean {
  return b.movement != null && b.movement < 0;
}

// ─── E. your courses ────────────────────────────────────────────────────────
export interface CourseLike { course_name: string; rounds_count: number; last_played: string | null; avg_to_par: number | null }
export interface CourseFigures {
  played: number;
  playedThisYear: number;
  rounds: number;
  /** V3 E.1 — the single lowest adjusted gross across every full round, with its course. */
  lowest: { gross: number; name: string | null } | null;
}

export interface LowestRoundLike {
  adjusted_gross: number | null;
  is_nine_hole: boolean;
  course?: { name?: string | null } | null;
}

/** V3 E.3 — nine-hole rounds and null grosses never qualify. */
export function lowestRound(scores: LowestRoundLike[] | null | undefined): CourseFigures['lowest'] {
  let best: CourseFigures['lowest'] = null;
  for (const s of scores ?? []) {
    if (s.is_nine_hole || s.adjusted_gross == null) continue;
    if (!best || s.adjusted_gross < best.gross) best = { gross: s.adjusted_gross, name: s.course?.name ?? null };
  }
  return best;
}

export function courseFigures(
  courses: CourseLike[] | null | undefined,
  scores: LowestRoundLike[] | null | undefined = null,
  now: Date = new Date(),
): CourseFigures | null {
  if (!courses || courses.length === 0) return null;
  const y = String(now.getFullYear());
  return {
    played: courses.length,
    playedThisYear: courses.filter((c) => c.last_played?.slice(0, 4) === y).length,
    rounds: courses.reduce((a, c) => a + (c.rounds_count ?? 0), 0),
    lowest: lowestRound(scores),
  };
}
