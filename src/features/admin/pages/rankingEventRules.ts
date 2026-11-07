import { formatDayMonthYearShortGB } from '@/i18n/format';
import { finishLabel } from '@/features/pro-profile/proProfileRules';

export type RankingEventStatus = 'auto' | 'manual' | 'ambiguous' | 'unmatched' | 'no_course';
export type RankingEventFilter = 'review' | 'matched' | 'all';

export interface RankingEventPlayed {
  pro: string;
  date: string;
  finish: string | null;
}

export interface RankingEventRuleRow {
  status: RankingEventStatus;
  candidate_count: number;
  course_name: string | null;
  country: string | null;
  years: number[];
  pros: number;
  played: RankingEventPlayed[];
}

export const STATUS_LABEL: Record<RankingEventStatus, string> = {
  ambiguous: 'Several matches',
  unmatched: 'Unmatched',
  auto: 'Matched · auto',
  manual: 'Matched',
  no_course: 'No course',
};

export const STATUS_TONE: Record<RankingEventStatus, 'warn' | 'danger' | 'ok' | 'neutral'> = {
  ambiguous: 'warn',
  unmatched: 'danger',
  auto: 'ok',
  manual: 'ok',
  no_course: 'neutral',
};

export function inFilter(status: RankingEventStatus, filter: RankingEventFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'review') return status === 'ambiguous' || status === 'unmatched';
  return status === 'auto' || status === 'manual' || status === 'no_course';
}

export function headerSummary(rows: Pick<RankingEventRuleRow, 'status'>[]): string {
  const counts: Record<RankingEventStatus, number> = { auto: 0, manual: 0, ambiguous: 0, unmatched: 0, no_course: 0 };
  rows.forEach((row) => { counts[row.status] += 1; });
  const parts = [
    `${rows.length} event${rows.length === 1 ? '' : 's'}`,
    counts.auto > 0 ? `${counts.auto} matched automatically` : null,
    counts.manual > 0 ? `${counts.manual} matched` : null,
    counts.ambiguous > 0 ? `${counts.ambiguous} several matches` : null,
    counts.unmatched > 0 ? `${counts.unmatched} unmatched` : null,
    counts.no_course > 0 ? `${counts.no_course} no course` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

const COUNT_WORDS: Record<number, string> = {
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
};

export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

function joinEnglish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function playedSentence(played: RankingEventPlayed[]): string {
  const dates = [...new Set(played.map((row) => row.date).filter(Boolean))]
    .map((date) => formatDayMonthYearShortGB(date));
  const byPro = new Map<string, string[]>();
  played.forEach((row) => {
    if (!byPro.has(row.pro)) byPro.set(row.pro, []);
    if (row.finish) byPro.get(row.pro)!.push(finishLabel(row.finish));
  });
  const groups = [...byPro.entries()].map(([pro, finishes]) =>
    finishes.length > 0 ? `${pro} (${finishes.join(', ')})` : pro,
  );
  return `Played ${joinEnglish(dates)}. Pros: ${joinEnglish(groups)}.`;
}

export function reasonLine(row: Pick<RankingEventRuleRow, 'status' | 'candidate_count' | 'course_name'>): string {
  switch (row.status) {
    case 'ambiguous':
      return `${countWord(row.candidate_count)} courses fit, so it wasn't matched automatically.`;
    case 'unmatched':
      return "No course fits, so it wasn't matched automatically.";
    case 'auto':
      return `Matched automatically to ${row.course_name}.`;
    case 'manual':
      return `Linked to ${row.course_name}.`;
    case 'no_course':
      return 'Recorded as no course.';
  }
}

export function cardMeta(row: Pick<RankingEventRuleRow, 'country' | 'years' | 'pros'>): string {
  return `${row.country || 'No country'} · ${row.years.join(', ')} · ${row.pros} pro${row.pros === 1 ? '' : 's'}`;
}
