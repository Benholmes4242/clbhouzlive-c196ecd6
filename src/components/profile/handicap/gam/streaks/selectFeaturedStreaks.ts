import type { StreakRow, StreakType } from '@/lib/gam/types';
import { STREAK_SHEET_ORDER } from './streakConfig';

/**
 * Per-row scoring — higher is "more featured-worthy". Determinism note:
 * this function is pure and must remain so for snapshot tests. The picker's
 * sort uses score plus three explicit tiebreakers and never relies on
 * insertion order alone.
 *
 * Snapshot scenarios (manually traced):
 *   1. All dormant w/ mixed best counts → sorts by best desc within score ties.
 *      counter(b=2), no_up(b=4), round_played(b=5)
 *      → [round_played, no_up, counter]  (all score 5, current=0, best desc)
 *   2. Mid-streak engaged user:
 *      counter active 7/12 → 50+5=55
 *      round_played active 4/4 (atPB) → 50+20+5=75
 *      birdie_round active 11/12 (1 from PB) → 50+15=65
 *      → [round_played, birdie_round, counter]
 *   3. Brand-new user (all zeros) → tiebreakers fall to STREAK_SHEET_ORDER
 *      → [counter, cutting, sub_80]
 */
function scoreStreak(r: StreakRow): number {
  const current = r.current_count ?? 0;
  const best = r.best_count ?? 0;
  const isActive = !!r.is_active && current > 0;

  let s = 0;
  if (isActive) s += 50;
  if (isActive && current === best) s += 20;
  if (isActive && best > 0 && best - current === 1) s += 15;
  if ((r.recent_activity_days ?? []).some((d) => d > 0)) s += 10;
  if (isActive && (r.streak_type === 'counter' || r.streak_type === 'round_played')) s += 5;
  if (!isActive && best > 0) s += 5;
  return s;
}

const SHEET_INDEX = new Map<StreakType, number>(
  STREAK_SHEET_ORDER.map((t, i) => [t, i]),
);

/**
 * Pick the 3 most relevant streaks for this user.
 *
 * Deterministic sort: score desc, then current_count desc, then best_count
 * desc, then natural STREAK_SHEET_ORDER index asc. Pure function — same
 * input always produces the same output. Snapshot-testable.
 *
 * If fewer than 3 input rows exist, returns whatever is available.
 */
export function selectFeaturedStreaks(rows: StreakRow[]): StreakRow[] {
  const scored = rows.map((r) => ({
    row: r,
    score: scoreStreak(r),
    sheetIdx: SHEET_INDEX.get(r.streak_type) ?? 99,
  }));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.row.current_count ?? 0) - (a.row.current_count ?? 0) ||
      (b.row.best_count ?? 0) - (a.row.best_count ?? 0) ||
      a.sheetIdx - b.sheetIdx,
  );

  return scored.slice(0, 3).map((s) => s.row);
}
