/**
 * AGEING OUT (BRIEF_HANDICAP_TAB_REBUILD phase 3, amendment A4).
 *
 * Pure derivation for the "Your index is about to rise on its own" section.
 * Built from projectNextRound (settleAt, counterDropping), the falling
 * walk RoundsThatCountSection already uses, and indexWithCandidate.
 * forecast.ts is deliberately NOT used.
 *
 * THE COUNTING RULE: this ranks differentials only for a HYPOTHETICAL state
 * (the window after the oldest drops). Which real round falls first is read
 * from is_counter (countsTowardIndex), never restated here.
 */
import type { WhsScoreWithIndex } from './types';
import { countsTowardIndex, counterWindow } from './counting';
import { differentialFromGross, indexFromDifferentials, indexWithCandidate } from './coursePlay';

export const AGEING_MIN_ROUNDS = 20;
/** Same horizon as RoundsThatCountSection's falling walk. */
export const AGEING_HORIZON = 5;
/**
 * Most repetitions of a lesser score we search. Beyond five in a row it stops
 * being advice a member can act on.
 */
export const MAX_REPEATS = 5;

export interface AgeingCourse {
  id: string;
  name: string;
  cr: number;
  slope: number;
}

export interface AgeingOut {
  current: number;
  settleAt: number;
  /** Rounds until the expiring counter drops; null when the walk finds none. */
  inRounds: number | null;
  expiring: WhsScoreWithIndex;
  /** True when the expiring round is the lowest differential in the twenty. */
  isBest: boolean;
  /** The differential that enters the counting eight in its place (projected). */
  replacement: number;
  /** Highest whole gross at the course that holds the index; null if none. */
  holdGross: number | null;
  /** A lesser (one-worse) score and how many times in a row holds it. */
  repeat: { gross: number; times: number } | null;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Roll k identical candidates into an oldest-first twenty. */
function indexAfterRepeats(oldestFirst: number[], candidate: number, k: number): number | null {
  let arr = oldestFirst;
  for (let i = 0; i < k - 1; i++) arr = [...arr.slice(1), candidate];
  return indexWithCandidate(arr, candidate);
}

/**
 * C1 (3A): index after the oldest `n` rounds leave the window and `n`
 * non-counting rounds enter — drop the oldest n, mean the best eight of the
 * remaining 20 − n. Same assumption settleAt makes for one round (C2). Null
 * when fewer than eight remain; no variable denominator.
 */
export function settleAfterRounds(oldestFirstDiffs: readonly number[], n: number): number | null {
  return indexFromDifferentials(oldestFirstDiffs.slice(n));
}

/**
 * `recentFirst`: the member's scores, newest first. `course`: pickCourse's
 * result for the twenty. Returns null whenever the section must not render.
 * Gate (3A C3): full twenty, the falling walk finds a counter within the
 * horizon, and the settled index for that fallsIn is > 0.05 above today.
 */
export function deriveAgeingOut(
  recentFirst: readonly WhsScoreWithIndex[],
  current: number | null,
  course: AgeingCourse | null,
): AgeingOut | null {
  if (current == null || recentFirst.length < AGEING_MIN_ROUNDS) return null;
  const window = counterWindow(recentFirst) as WhsScoreWithIndex[];
  if (window.some((r) => typeof r.handicap_differential !== 'number' || !Number.isFinite(r.handicap_differential))) return null;

  const oldestFirstRounds = [...window].sort(
    (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
  );
  const oldestFirst = oldestFirstRounds.map((r) => r.handicap_differential as number);

  // The falling walk, oldest first, over the horizon (is_counter) — same as
  // RoundsThatCountSection's.
  let fallsIn: number | null = null;
  for (let i = 0; i < Math.min(AGEING_HORIZON, oldestFirstRounds.length); i++) {
    if (countsTowardIndex(oldestFirstRounds[i])) { fallsIn = i + 1; break; }
  }
  if (fallsIn == null) return null;

  const settleRaw = settleAfterRounds(oldestFirst, fallsIn);
  if (settleRaw == null || !(settleRaw > current + 0.05)) return null;

  const expiring = oldestFirstRounds[fallsIn - 1];
  const all = [...oldestFirst].sort((a, b) => a - b);
  const isBest = (expiring.handicap_differential as number) <= all[0];
  // The differential that becomes eighth-lowest once the oldest fallsIn leave.
  const replacement = oldestFirst.slice(fallsIn).sort((a, b) => a - b)[7];

  let holdGross: number | null = null;
  let repeat: AgeingOut['repeat'] = null;
  if (course) {
    // 3B D4: with N chances, the other N - 1 rounds are assumed not to make
    // the eight, so the oldest N - 1 simply leave before the candidate rolls in.
    const base = oldestFirst.slice(fallsIn - 1);
    const holds = (g: number, k = 1) => {
      const idx = indexAfterRepeats(base, differentialFromGross(g, course.cr, course.slope), k);
      return idx != null && r1(idx) <= r1(current);
    };
    const top = Math.ceil(course.cr + 60);
    for (let g = top; g >= Math.floor(course.cr - 40); g--) {
      if (holds(g)) { holdGross = g; break; }
    }
    if (holdGross != null) {
      const lesser = holdGross + 1;
      for (let k = 2; k <= MAX_REPEATS; k++) {
        if (holds(lesser, k)) { repeat = { gross: lesser, times: k }; break; }
      }
    }
  }

  return {
    current,
    settleAt: r1(settleRaw),
    inRounds: fallsIn,
    expiring,
    isBest,
    replacement,
    holdGross,
    repeat,
  };
}

