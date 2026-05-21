import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

export interface StreakInfo {
  who: 'you' | 'them';
  count: number;
}

type Result = FriendRivalryHydrated['shared_round_results'][number];

export function computeStreak(
  results: FriendRivalryHydrated['shared_round_results'] | null | undefined,
  dimension: RivalryDimension,
): StreakInfo | null {
  if (!results || results.length === 0) return null;
  const sorted = [...results].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const pick = (r: Result) =>
    dimension === 'gross' ? r.gross_outcome : r.stableford_outcome;
  const head = pick(sorted[0]);
  if (head === 'T') return null;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (pick(sorted[i]) === head) count++;
    else break;
  }
  return { who: head === 'W' ? 'you' : 'them', count };
}

export function fmtDaysAgo(playDate: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(playDate).getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export interface TaleOfTheTape {
  strongestCourse: { name: string; wins: number; losses: number } | null;
  lastMet: string | null;
  /** user_gross - rival_gross averaged. Negative = user better. */
  averageEdge: number | null;
  earliestPlayDate: string | null;
}

export function calculateTaleOfTheTape(
  results: FriendRivalryHydrated['shared_round_results'] | null | undefined,
  dimension: RivalryDimension,
): TaleOfTheTape {
  if (!results || results.length === 0) {
    return { strongestCourse: null, lastMet: null, averageEdge: null, earliestPlayDate: null };
  }
  const byCourse = new Map<string, { name: string; w: number; l: number }>();
  for (const r of results) {
    const outcome = dimension === 'gross' ? r.gross_outcome : r.stableford_outcome;
    const c = byCourse.get(r.course_id) ?? { name: r.course_name, w: 0, l: 0 };
    if (outcome === 'W') c.w += 1;
    if (outcome === 'L') c.l += 1;
    byCourse.set(r.course_id, c);
  }
  let strongest: { name: string; wins: number; losses: number } | null = null;
  let strongestRatio = -Infinity;
  for (const c of byCourse.values()) {
    if (c.w + c.l < 2) continue;
    const ratio = c.w - c.l;
    if (ratio > strongestRatio) {
      strongestRatio = ratio;
      strongest = { name: c.name, wins: c.w, losses: c.l };
    }
  }

  const sorted = [...results].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const lastMet = fmtDaysAgo(sorted[0].play_date);
  const earliestPlayDate = sorted[sorted.length - 1].play_date;

  const grossSum = results.reduce((acc, r) => acc + (r.user_gross - r.rival_gross), 0);
  const averageEdge = grossSum / results.length;

  return { strongestCourse: strongest, lastMet, averageEdge, earliestPlayDate };
}

export function yearsSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 365)));
}
