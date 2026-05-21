import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import { formatDateShort, shortCourseName } from './helpers';

export interface Insight {
  label: string;
  value: string;
  sub: string;
  tone: 'positive' | 'negative' | 'neutral' | 'amber';
}

type Round = FriendRivalryHydrated['shared_round_results'][number];

const MIN_MEETINGS_FOR_BEST_COURSE = 5;

function absDelta(r: Round, dim: RivalryDimension): number {
  return dim === 'stableford'
    ? Math.abs((r.user_stableford ?? 0) - (r.rival_stableford ?? 0))
    : Math.abs((r.user_gross ?? 0) - (r.rival_gross ?? 0));
}

export function computeYourBestMargin(
  rounds: Round[],
  dim: RivalryDimension,
): Insight | null {
  const wins = rounds.filter((r) =>
    dim === 'stableford' ? r.stableford_outcome === 'W' : r.gross_outcome === 'W',
  );
  if (wins.length === 0) return null;
  let best = wins[0];
  let bestDelta = absDelta(best, dim);
  for (const r of wins) {
    const d = absDelta(r, dim);
    if (d > bestDelta) {
      best = r;
      bestDelta = d;
    }
  }
  const unit = dim === 'stableford' ? ' pts' : '';
  return {
    label: 'Your best margin',
    value: `+${bestDelta}${unit}`,
    sub: formatDateShort(best.play_date),
    tone: 'positive',
  };
}

export function computeTheirBestMargin(
  rounds: Round[],
  dim: RivalryDimension,
  rivalName: string,
): Insight | null {
  const losses = rounds.filter((r) =>
    dim === 'stableford' ? r.stableford_outcome === 'L' : r.gross_outcome === 'L',
  );
  if (losses.length === 0) return null;
  let best = losses[0];
  let bestDelta = absDelta(best, dim);
  for (const r of losses) {
    const d = absDelta(r, dim);
    if (d > bestDelta) {
      best = r;
      bestDelta = d;
    }
  }
  const unit = dim === 'stableford' ? ' pts' : '';
  return {
    label: `${rivalName}'s best margin`,
    value: `−${bestDelta}${unit}`,
    sub: formatDateShort(best.play_date),
    tone: 'negative',
  };
}

export function computeYourBestCourse(
  rounds: Round[],
  dim: RivalryDimension,
): Insight | null {
  const byCourse = new Map<
    string,
    { name: string; wins: number; total: number }
  >();
  for (const r of rounds) {
    const e =
      byCourse.get(r.course_id) ?? { name: r.course_name, wins: 0, total: 0 };
    e.total += 1;
    const outcome = dim === 'stableford' ? r.stableford_outcome : r.gross_outcome;
    if (outcome === 'W') e.wins += 1;
    byCourse.set(r.course_id, e);
  }
  const eligible = Array.from(byCourse.values())
    .filter((e) => e.total >= MIN_MEETINGS_FOR_BEST_COURSE && e.wins > 0)
    .sort((a, b) => b.wins / b.total - a.wins / a.total);
  if (eligible.length === 0) return null;
  const top = eligible[0];
  return {
    label: 'You play best at',
    value: shortCourseName(top.name),
    sub: `${top.wins} of ${top.total} rounds`,
    tone: 'amber',
  };
}

export function computeLastMeeting(
  rounds: Round[],
  dim: RivalryDimension,
  rivalName: string,
): Insight | null {
  if (rounds.length === 0) return null;
  const sorted = [...rounds].sort((a, b) =>
    b.play_date.localeCompare(a.play_date),
  );
  const last = sorted[0];
  const outcome =
    dim === 'stableford' ? last.stableford_outcome : last.gross_outcome;
  const delta = absDelta(last, dim);
  const unit = dim === 'stableford' ? 'pts' : 'strokes';
  let sub: string;
  if (outcome === 'W') sub = `You won by ${delta} ${unit}`;
  else if (outcome === 'L') sub = `${rivalName} won by ${delta} ${unit}`;
  else sub = 'Tied';
  return {
    label: 'Last meeting',
    value: formatDateShort(last.play_date),
    sub,
    tone: outcome === 'W' ? 'positive' : outcome === 'L' ? 'negative' : 'neutral',
  };
}

export function computeInsights(
  rivalry: FriendRivalryHydrated,
  dim: RivalryDimension,
  rivalFirstName: string,
): Insight[] {
  const rounds = rivalry.shared_round_results ?? [];
  return [
    computeYourBestMargin(rounds, dim),
    computeTheirBestMargin(rounds, dim, rivalFirstName),
    computeYourBestCourse(rounds, dim),
    computeLastMeeting(rounds, dim, rivalFirstName),
  ].filter((i): i is Insight => i !== null);
}
