/** Coming-up owns calendar-day countdowns, tag priority and own-round figures.
 * Five visible events (next + four rows); above-page exclusions and order
 * belong to overviewEventSelection. Never derive member play
 * from anyone else's rounds or from a name match. */
import type { ComingUpRow } from '../data/useComingUp';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';

const dateOf = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`);
export function comingCountdown(start: string, now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const date = dateOf(start);
  const days = Math.max(0, Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - today) / 86400000));
  return days === 0 ? { key: 'today', count: 0 } : days === 1 ? { key: 'tomorrow', count: 1 } : days <= 30 ? { key: 'days', count: days } : { key: 'weeks', count: Math.floor(days / 7) };
}
export function comingTag(row: ComingUpRow): string | null {
  if (row.isMajor) return 'major';
  if (/tour championship/i.test(row.name)) return 'finale';
  if (row.isPlayoff) return 'playoffs';
  return row.event_type === 'team' ? 'team' : null;
}
export function comingDates(start: string, end: string): string {
  const a = dateOf(start); const b = dateOf(end);
  const format = (d: Date, month: boolean) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', ...(month ? { month: 'short' as const } : {}), timeZone: 'UTC' }).format(d);
  return `${format(a, a.getUTCMonth() !== b.getUTCMonth() || a.getUTCFullYear() !== b.getUTCFullYear())} – ${format(b, true)}`;
}
export function comingMonth(start: string, now = new Date()): string {
  const date = dateOf(start);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', ...(date.getUTCFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}), timeZone: 'UTC' }).format(date).toUpperCase();
}
export function comingDateBlock(start: string) {
  const date = dateOf(start);
  const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date).toUpperCase();
  return { day: date.getUTCDate(), weekday: fmt({ weekday: 'short' }), month: fmt({ month: 'short' }) };
}
export function comingMoney(amount?: number | null, currency?: string | null): string | null {
  if (amount == null || amount <= 0 || !currency) return null;
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(amount).replace(/M$/, 'm').replace(/K$/, 'k'); } catch { return null; }
}
export function defendingResult(champion: string | null, finishers?: LastYearFinisher[] | null) {
  if (!champion) return null;
  const surname = champion.trim().split(/\s+/).at(-1) ?? champion;
  const winners = finishers?.filter(f => f.rank.replace('T', '') === '1') ?? [];
  const winner = winners.find(f => f.name.trim().toLowerCase() === champion.trim().toLowerCase());
  const other = finishers?.find(f => f !== winner);
  const scoreOf = (score: string) => score === 'E' ? 0 : Number(score.replace('−', '-').replace('–', '-'));
  const score = winner ? scoreOf(winner.score) : NaN;
  const runnerScore = other ? scoreOf(other.score) : NaN;
  return { surname, score: Number.isFinite(score) ? score : null, scoreLabel: winner?.score, margin: Number.isFinite(score) && Number.isFinite(runnerScore) ? runnerScore - score : null, photoUrl: winner?.photoUrl };
}
export interface OwnCourseRound { course_id: string | null; gross_score: number | null; holes_played: number | null }
export interface OwnCourseFigure { rounds: number; best: number | null }
export function ownCourseFigures(rows: OwnCourseRound[]): Map<string, OwnCourseFigure> {
  const result = new Map<string, OwnCourseFigure>();
  for (const row of rows) {
    if (!row.course_id) continue;
    const figure = result.get(row.course_id) ?? { rounds: 0, best: null };
    figure.rounds++;
    if (row.holes_played === 18 && row.gross_score != null) figure.best = figure.best == null ? row.gross_score : Math.min(figure.best, row.gross_score);
    result.set(row.course_id, figure);
  }
  return result;
}