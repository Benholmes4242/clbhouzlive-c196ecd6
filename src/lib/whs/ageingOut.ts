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
import { projectNextRound } from './handicapMath';
import { countsTowardIndex, counterWindow } from './counting';
import { differentialFromGross, indexWithCandidate } from './coursePlay';

export const AGEING_MIN_ROUNDS = 20;
/** Same horizon as RoundsThatCountSection's falling walk. */
export const AGEING_HORIZON = 5;
/** Most repetitions of a lesser score we will search. */
const MAX_REPEATS = AGEING_HORIZON;

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
 * `recentFirst`: the member's scores, newest first. `course`: pickCourse's
 * result for the twenty. Returns null whenever the section must not render.
 */
export function deriveAgeingOut(
  recentFirst: readonly WhsScoreWithIndex[],
  current: number | null,
  course: AgeingCourse | null,
): AgeingOut | null {
  if (current == null || recentFirst.length < AGEING_MIN_ROUNDS) return null;
  const window = counterWindow(recentFirst) as WhsScoreWithIndex[];
  const diffs = window.map((r) => r.handicap_differential);
  if (diffs.some((d) => typeof d !== 'number' || !Number.isFinite(d))) return null;

  const p = projectNextRound(window, current);
  if (!p.hasData || !p.counterDropping || p.settleAtRaw == null) return null;
  if (!(p.settleAtRaw > current + 0.05)) return null;

  const oldestFirstRounds = [...window].sort(
    (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
  );
  const expiring = oldestFirstRounds[0];
  const oldestFirst = oldestFirstRounds.map((r) => r.handicap_differential as number);

  // The falling walk, oldest first, over the five-round horizon (is_counter).
  let inRounds: number | null = null;
  for (let i = 0; i < Math.min(AGEING_HORIZON, oldestFirstRounds.length); i++) {
    if (countsTowardIndex(oldestFirstRounds[i])) { inRounds = i + 1; break; }
  }

  const all = [...oldestFirst].sort((a, b) => a - b);
  const isBest = (expiring.handicap_differential as number) <= all[0];
  // Projected: of the remaining nineteen, the eighth-lowest joins the eight.
  const remaining = oldestFirst.slice(1).sort((a, b) => a - b);
  const replacement = remaining[7];

  let holdGross: number | null = null;
  let repeat: AgeingOut['repeat'] = null;
  if (course) {
    const holds = (g: number, k = 1) => {
      const idx = indexAfterRepeats(oldestFirst, differentialFromGross(g, course.cr, course.slope), k);
      return idx != null && r1(idx) <= r1(current);
    };
    // Search downward from a gross well above anything plausible.
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
    settleAt: r1(p.settleAtRaw),
    inRounds,
    expiring,
    isBest,
    replacement,
    holdGross,
    repeat,
  };
}
