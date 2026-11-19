/** CS1 — pure rules for the Course tab's "Lately here" section. */
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { feedStrokesReceived } from '@/components/feed/roundTilePlot';
import { recentSentenceCourse } from '@/features/explore-magazine/watch/roundsShelfRules';

/** The three figures need at least this many rounds in the window. */
export const LATELY_TILES_MIN = 4;

/** "+10.8" / "E" / "−1.2" (U+2212), one decimal. */
export function signedAvg(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '–';
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'E';
  return r < 0 ? `−${Math.abs(r).toFixed(1)}` : `+${r.toFixed(1)}`;
}

/** "Oct 29"; the year joins only when it is not this year. Rendered uppercase. */
export function latelyShortDate(iso: string | null, locale = 'en', now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

/* ── COURSE_PAGE_ROUND_TILES — the tile's pure rules ─────────────────────── */

export const LATELY_UNDER_RED = '#E24B3F';

/** "E" / "−2" / "+4" (U+2212). */
export function signedWhole(v: number): string {
  if (v === 0) return 'E';
  return v < 0 ? `−${Math.abs(v)}` : `+${v}`;
}

/** Course handicap as printed: plus handicaps (stored negative) read "+2". */
export function playedOffLabel(ch: number | null | undefined): string | null {
  if (ch == null || !Number.isFinite(ch)) return null;
  return ch < 0 ? `+${Math.abs(ch)}` : String(ch);
}

/** Stableford points: only on 18 played holes with a received-strokes allocation. */
export function stablefordPoints(shape: HoleShape | null | undefined, courseHandicap: number | null | undefined): number | null {
  if (!shape || shape.holes.length !== 18) return null;
  const received = feedStrokesReceived(shape, courseHandicap);
  if (!received || received.length !== 18) return null;
  let total = 0;
  for (let i = 0; i < 18; i += 1) {
    const h = shape.holes[i];
    if (h.par == null || h.strokes == null) return null;
    total += Math.max(0, 2 - (h.strokes - h.par - (received[i] ?? 0)));
  }
  return total;
}

export type NineMark = 'under' | 'par' | 'bogey' | 'double' | 'triple' | 'blank';
export interface NineCell { hole: number; strokes: number | null; mark: NineMark }
export interface Nine { label: 'OUT' | 'IN'; cells: NineCell[]; total: number | null }

export function nineMark(strokes: number | null, par: number | null): NineMark {
  if (strokes == null || par == null) return 'blank';
  const d = strokes - par;
  if (d < 0) return 'under';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  if (d === 2) return 'double';
  return 'triple';
}

/** OUT 1–9 and IN 10–18 from the shape's actual strokes; unplayed holes blank. */
export function latelyNines(shape: HoleShape | null | undefined): Nine[] | null {
  if (!shape) return null;
  const byHole = new Map(shape.holes.map((h) => [h.holeNo, h]));
  const build = (label: Nine['label'], from: number): Nine => {
    const cells: NineCell[] = [];
    let total = 0;
    let any = false;
    for (let n = from; n < from + 9; n += 1) {
      const h = byHole.get(n);
      const strokes = h?.strokes ?? null;
      if (strokes != null) { total += strokes; any = true; }
      cells.push({ hole: n, strokes, mark: strokes == null ? 'blank' : nineMark(strokes, h?.par ?? null) });
    }
    return { label, cells, total: any ? total : null };
  };
  return [build('OUT', 1), build('IN', 10)];
}

/** One decimal, U+2212 / "+". */
export function signedDelta(v: number): string {
  const r = Math.round(v * 10) / 10;
  return r < 0 ? `−${Math.abs(r).toFixed(1)}` : `+${r.toFixed(1)}`;
}

export interface TileLine { key: string; defaultValue: string; values: Record<string, string | number> }

const LINE = 'courseDetail.lately.tile.';
const AGAINST = ' · <b>{{delta}}</b> against {{possessive}} average here';

/** The line under the score: recentSentenceCourse's order, the tile's copy. */
export function latelyTileLine(row: StandoutRound, own: boolean, locale = 'en'): TileLine | null {
  const rule = recentSentenceCourse({ ...row, course_name: row.course_name || 'here' }, locale);
  if (!rule) return null;
  const possessive = own ? 'your' : 'their';
  const delta = row.delta;
  const hasDelta = delta != null && Number.isFinite(delta);
  const base = { possessive };
  const name = rule.key.replace('amateur.standout.', '');
  switch (name) {
    case 'firstRound':
      return { key: `${LINE}firstRound`, defaultValue: '<b>First round</b> here', values: base };
    case 'bestEver':
      return hasDelta
        ? { key: `${LINE}bestEver`, defaultValue: `<b>Best</b> of {{possessive}} {{n}} rounds here${AGAINST}`, values: { ...base, n: row.prior_n + 1, delta: signedDelta(delta) } }
        : { key: `${LINE}bestEverNoDelta`, defaultValue: '<b>Best</b> of {{possessive}} {{n}} rounds here', values: { ...base, n: row.prior_n + 1 } };
    case 'bestSince':
      return hasDelta
        ? { key: `${LINE}bestSince`, defaultValue: `<b>Best here since {{month}}</b>${AGAINST}`, values: { ...base, month: rule.month ?? '', delta: signedDelta(delta) } }
        : { key: `${LINE}bestSinceNoDelta`, defaultValue: '<b>Best here since {{month}}</b>', values: { ...base, month: rule.month ?? '' } };
    case 'ordinalRound':
      return { key: `${LINE}ordinalRound`, defaultValue: '<b>{{ordinal}} round</b> here', values: { ...base, ordinal: rule.ordinal ?? '' } };
    default:
      if (!hasDelta) return null;
      if (Math.abs(delta) < 0.05) return { key: `${LINE}level`, defaultValue: '<b>Level</b> with {{possessive}} average here', values: base };
      return { key: `${LINE}average`, defaultValue: '<b>{{delta}}</b> against {{possessive}} average here', values: { ...base, delta: signedDelta(delta) } };
  }
}

/** Splits "<b>x</b> y" into alternating plain / bold parts. */
export function boldParts(text: string): Array<{ bold: boolean; text: string }> {
  const out: Array<{ bold: boolean; text: string }> = [];
  const re = /<b>(.*?)<\/b>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ bold: false, text: text.slice(last, m.index) });
    out.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ bold: false, text: text.slice(last) });
  return out;
}

/** Plain-string interpolation for when t() hands back its template unchanged. */
export function fillTemplate(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => (values[k] != null ? String(values[k]) : ''));
}
