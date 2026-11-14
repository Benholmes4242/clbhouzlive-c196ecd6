/** Pure Ranking-tab rules: gating, movement wording, log-scale chart maths and
 * event labels. Weeks are ISO YYYYWW numbers; a better rank is a LOWER number,
 * so a positive (other − current) difference is an improvement. */
import { wagrOrdinal } from './wagrSettingsRules';

export type AmateurHistoryRow = { id: number; week: number; rank: number; finish: string | null; event_id?: number | null; event_name?: string | null };
export type AmateurEventRow = { wagr_event_id: number; event_name: string; event_week: string | null; week_year: string | null; country: string | null; finish: string | null; points: number | null };

/** The tab exists only on personal profiles of non-pros whose summary read
 * returned a row (the server gates the rows; no rows means no tab). */
export const rankingTabVisible = (isPersonal: boolean, proMember: unknown, summary: unknown): boolean =>
  isPersonal && proMember == null && summary != null;

/** Ranking sits directly after Posts, the same way the Tour tab is inserted. */
export function insertRankingTab(tabs: { id: string; label: string }[]): { id: string; label: string }[] {
  const out = [...tabs];
  const at = out.findIndex(t => t.id === 'activity');
  out.splice(at >= 0 ? at + 1 : 0, 0, { id: 'ranking', label: 'Ranking' });
  return out;
}

/** Thursday of an ISO week given as YYYYWW (UTC, so the month never drifts). */
export function isoWeekThursday(week: number): Date {
  const year = Math.floor(week / 100);
  const w = week % 100;
  const jan4 = Date.UTC(year, 0, 4);
  const dow = new Date(jan4).getUTCDay() || 7;
  return new Date(jan4 + (4 - dow) * 86400000 + (w - 1) * 7 * 86400000);
}

/* Fixed three-letter months: en-GB ICU renders September as "Sept", but the
   signed-off mock reads "Sep". */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "JUL 2024" — upper-case month of the ISO week's Thursday. */
export function axisLabel(week: number): string {
  const thursday = isoWeekThursday(week);
  return `${MONTHS[thursday.getUTCMonth()]} ${thursday.getUTCFullYear()}`.toUpperCase();
}

/** "Sep 2026" for an event. event_week is a DATE (the Thursday of the ISO
 * week, e.g. '2026-09-24') and wins when present; the WAGR "WW/YYYY" text in
 * week_year is the fallback. Parsed as UTC so the month never drifts. */
export function eventMonthLabel(event: { event_week: string | null; week_year: string | null }): string {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.event_week ?? '');
  if (date) return `${MONTHS[Number(date[2]) - 1]} ${date[1]}`;
  const week = /^(\d{1,2})\/(\d{4})$/.exec(event.week_year ?? '');
  if (week) {
    const thursday = isoWeekThursday(Number(week[2]) * 100 + Number(week[1]));
    return `${MONTHS[thursday.getUTCMonth()]} ${thursday.getUTCFullYear()}`;
  }
  return '';
}

export type RankingMovementPart = { direction: 'up' | 'down' | 'same'; amount: number };
export type RankingMovement = { thisWeek: RankingMovementPart; year: RankingMovementPart | null };

const part = (current: number, other: number): RankingMovementPart => {
  const delta = other - current;
  return delta > 0 ? { direction: 'up', amount: delta } : delta < 0 ? { direction: 'down', amount: -delta } : { direction: 'same', amount: 0 };
};

/** Movement needs at least two distinct weeks. This week compares the last row
 * of the latest week with the last row of the week before it; the year compares
 * with the last row at or before the same ISO week a year earlier (W − 100). */
export function rankingMovement(rows: AmateurHistoryRow[]): RankingMovement | null {
  if (rows.length < 2) return null;
  const last = rows[rows.length - 1];
  const W = last.week;
  if (new Set(rows.map(r => r.week)).size < 2) return null;
  const earlier = rows.filter(r => r.week < W);
  const previousWeek = Math.max(...earlier.map(r => r.week));
  const previousLast = [...earlier].reverse().find(r => r.week === previousWeek)!;
  const yearRows = rows.filter(r => r.week <= W - 100);
  return {
    thisWeek: part(last.rank, previousLast.rank),
    year: yearRows.length > 0 ? part(last.rank, yearRows[yearRows.length - 1].rank) : null,
  };
}

export type RankingChartPoint = { x: number; y: number; rank: number; finish: string | null };

const round1 = (value: number) => Math.round(value * 10) / 10;

/** viewBox 0 0 350 118, log scale so the best rank sits at the top. */
export function rankingChartPoints(rows: AmateurHistoryRow[]): RankingChartPoint[] {
  const n = rows.length;
  if (n === 0) return [];
  const ranks = rows.map(r => r.rank);
  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  return rows.map((row, i) => ({
    x: round1(4 + (i * 342) / (n - 1 || 1)),
    y: min === max ? 57 : round1(14 + ((Math.log(row.rank) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 86),
    rank: row.rank,
    finish: row.finish,
  }));
}

/** Rank labels sit above their point; below y 4 they flip under it instead
 * (the signed-off mock keeps the last label at y 6.6). */
export function rankingLabelY(y: number, offset: number, flipped: number): number {
  const value = round1(y + offset);
  return value < 4 ? round1(y + flipped) : value;
}

export function finishLabel(finish: string | null): { text: string; dim: boolean } {
  if (finish == null || finish.trim() === '') return { text: '–', dim: true };
  const trimmed = finish.trim();
  if (/^\d+$/.test(trimmed)) return { text: wagrOrdinal(Number(trimmed)), dim: false };
  if (trimmed === 'Participant') return { text: 'Team', dim: true };
  return { text: trimmed, dim: true };
}


export type AmateurCareerMoment = { id: string; year: number; text: string; is_win: boolean; created_at: string };
export type AmateurCareerEntry = AmateurCareerMoment & { derived: boolean; kind: number; order: string };
/** Whole-career figures never use the rolling summary; repeated event ids count once. */
export function amateurCareerTotals(history: AmateurHistoryRow[]) {
  const ids = (accept: (row: AmateurHistoryRow) => boolean) => new Set(history.filter(row => row.event_id != null && accept(row)).map(row => row.event_id)).size;
  return { wins: ids(row => row.finish === '1'), top10s: ids(row => /^(?:[1-9]|10)$/.test(row.finish ?? '')), events: ids(() => true) };
}
/** Shared ordering mirrors pro careerEntries: year, kind, descending date, id. */
export function amateurCareerEntries(history: AmateurHistoryRow[], moments: AmateurCareerMoment[]): AmateurCareerEntry[] {
  const rows = [...history].sort((a,b) => a.week-b.week || a.id-b.id);
  const events = rows.filter(row => row.event_id != null && row.event_name);
  const unique = events.filter((row,index) => events.findIndex(other => other.event_id === row.event_id) === index);
  const entries: AmateurCareerEntry[] = moments.map(moment => ({ ...moment, derived: false, kind: 2, order: moment.created_at }));
  const add = (row: AmateurHistoryRow, kind: number, text: string, is_win = false) => {
    const date = isoWeekThursday(row.week);
    entries.push({ id: `${kind}-${row.id}`, year: date.getUTCFullYear(), text, is_win, created_at: date.toISOString(), derived: true, kind, order: date.toISOString() });
  };
  const high = [...rows].sort((a,b) => a.rank-b.rank || a.week-b.week || a.id-b.id)[0];
  if (high) add(high,0,`Career-high world amateur ranking, #${high.rank}`);
  unique.filter(row => row.finish === '1').forEach(row => add(row,1,`Won ${row.event_name}`,true));
  unique.filter(row => row.finish === '2' || row.finish === '3').reverse().slice(0,5).forEach(row => add(row,1,`${row.finish === '2' ? '2nd' : '3rd'}, ${row.event_name}`));
  const first = unique[0];
  if (first) add(first,3,`First world amateur ranking event, ${first.event_name}`);
  return entries.sort((a,b) => b.year-a.year || a.kind-b.kind || b.order.localeCompare(a.order) || a.id.localeCompare(b.id));
}
