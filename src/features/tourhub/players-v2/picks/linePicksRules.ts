/**
 * linePicksRules — pure rules for the build 2 "Who keeps their card?" card:
 * state resolution, the six-row pick window, member shares, dates and every
 * sentence. The card renders only what these return; nothing is invented.
 */
import { ordinal, type Rich, type Stake } from '../playersRules';

export type PickState = 'open' | 'closed' | 'settled' | 'hidden';
export const MAX_PICKS = 3;

export function resolvePickState(
  race: { status: string | null; picks_close_at: string | null } | null,
  stake: Pick<Stake, 'picks' | 'settled_at'>,
  now: Date,
): PickState {
  if (!race || !stake.picks) return 'hidden';
  if (stake.settled_at) return 'settled';
  if (!race.picks_close_at) return 'hidden';
  if (race.status === 'final') return 'hidden';
  const closes = new Date(race.picks_close_at).getTime();
  if (now.getTime() < closes) return race.status === 'live' ? 'open' : 'hidden';
  return 'closed';
}

/** round(pickers / total × 100); 0 when nobody picked. */
export function memberShare(pickers: number | null | undefined, total: number | null | undefined): number {
  if (!total || !pickers) return 0;
  return Math.round((pickers / total) * 100);
}

/**
 * The six players at L−2 … L+3 of today's standings, then any of the viewer's
 * picks no longer among them, in standings order.
 */
export function pickWindow<T extends { key: string; rank: number }>(players: T[], L: number, mine: Set<string>): { window: T[]; extra: T[] } {
  const window = players.slice(Math.max(0, L - 3), L + 3);
  const inWindow = new Set(window.map((p) => p.key));
  const extra = players.filter((p) => mine.has(p.key) && !inWindow.has(p.key));
  return { window, extra };
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
function parts(iso: string, weekday: 'short' | 'long'): { wd: string; d: string; m: string } {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { timeZone: /^\d{4}-\d{2}-\d{2}$/.test(iso) ? 'UTC' : tz() };
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...opts, ...o }).format(date);
  return { wd: f({ weekday }), d: f({ day: 'numeric' }), m: f({ month: 'short' }) };
}
/** "Thu 19 Nov" in the viewer's timezone. */
export function fmtDdd(iso: string): string {
  const p = parts(iso, 'short');
  return `${p.wd} ${p.d} ${p.m}`;
}
/** "Sunday 22 Nov". */
export function fmtDddd(iso: string): string {
  const p = parts(iso, 'long');
  return `${p.wd} ${p.d} ${p.m}`;
}
/** "3 Nov". */
export function fmtDMon(iso: string): string {
  const p = parts(iso, 'short');
  return `${p.d} ${p.m}`;
}

export function keptTitle(title: string): string {
  return title.replace(/KEEPS/g, 'KEPT');
}

export function openLine(L: number): string {
  return `Pick up to three players from ${ordinal(L - 2)} to ${ordinal(L + 3)} to finish inside the top ${L}. The bar is how many clbhouz members picked them.`;
}

export function openFoot(mine: number, total: number, lastEvent: string): string {
  const you = mine > 0 ? `You've picked ${mine} of ${MAX_PICKS}. ` : '';
  const rest = `Settled after the ${lastEvent}, with a leaderboard of who called it.`;
  if (total === 0) return `${you}Be the first to pick. ${rest}`;
  return `${you}${total.toLocaleString('en-GB')} members have picked. ${rest}`;
}

/** Closed line: event end date in the future → its weekday; past → "Settled on Monday." */
export function closedLine(lastEvent: string, endDate: string | null | undefined, now: Date): string {
  const head = `The ${lastEvent} is under way.`;
  if (!endDate) return `${head} Settled on Monday.`;
  const ended = `${endDate}T23:59:59Z` < now.toISOString();
  return ended ? `${head} Settled on Monday.` : `${head} Settled when it finishes on ${fmtDddd(endDate)}.`;
}

export function closedFoot(total: number, mine: number): string {
  return `${total.toLocaleString('en-GB')} members picked.${mine > 0 ? ` You picked ${mine}.` : ''}`;
}

export function settledLine(r: { viewer_picks: number; viewer_correct: number; all_correct: number; total_pickers: number }): Rich {
  const all: Rich = [
    { text: `${r.all_correct.toLocaleString('en-GB')}`, bold: true },
    { text: ` of ${r.total_pickers.toLocaleString('en-GB')} members called all three.` },
  ];
  if (!r.viewer_picks) return all;
  return [{ text: 'You called ' }, { text: `${r.viewer_correct} of ${r.viewer_picks}`, bold: true }, { text: '. ' }, ...all];
}

/** Settled picks: by final position, players with none last. */
export function orderByFinal<T extends { final_position: number | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.final_position ?? Infinity) - (b.final_position ?? Infinity));
}

/** Top five, then the viewer's own row when it is not among them. */
export function callersList<T extends { is_viewer: boolean; rank: number }>(rows: T[], limit = 5): T[] {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const top = sorted.filter((r) => !r.is_viewer).slice(0, limit);
  const me = sorted.find((r) => r.is_viewer);
  if (!me) return top;
  const meInTop = sorted.slice(0, limit).includes(me);
  if (meInTop) return sorted.slice(0, limit);
  return [...top, me];
}
