import type { WhsScore } from './types';
import { projectNextRound } from './handicapMath';

/**
 * Trend-projection helper for the Forecast card.
 *
 * Approach: hold the EWMA-projected diff constant and simulate 5 rolling-window
 * steps. At each step the oldest real round rolls out and a synthetic round at
 * the projected diff rolls in. Final projected handicap = mean of the lowest 8
 * after step 5. "EWMA" is never exposed to users; in copy it's "trend projection".
 *
 * Cut-target guidance is delegated to projectNextRound so the same number
 * surfaces on both the Forecast card and NextRoundWatch.
 */

export type ForecastState =
  | 'worsening'
  | 'improving'
  | 'steady'
  | 'sharp-drop'
  | 'sharp-rise'
  | 'building'
  | 'brand-new';

export interface CounterCell {
  score: WhsScore;
  differential: number;
  /** 0 = best, 7 = weakest (within the current 8 counters, sorted ascending). */
  rank: number;
  /** True if this counter's round is among the 5 oldest in the window (at risk of rolling off within the projection horizon). */
  isExpiring: boolean;
  /** True if this counter is also in the most recent 5 rounds. */
  isNew: boolean;
}

export interface Forecast {
  state: ForecastState;
  current: number | null;
  /** Projected handicap after 5 simulated rounds. Null in empty states. */
  projected: number | null;
  /** projected - current. Negative = improving. */
  delta: number | null;
  /** Always 5 in non-empty states. */
  roundsOut: 5 | null;
  /** Calendar label for the projection horizon (e.g. "late June"). */
  whenLabel: string | null;
  /** Counters whose rounds fall in the 5 oldest of the window (at risk of rolling off in the horizon). Equals countersAtRiskInHorizon. */
  expiringCount: number;
  /** How many of the most recent 5 rounds are current counters. */
  newCount: number;
  /**
   * How many of the 5 oldest rounds in the window are counters. Drives the
   * strip header copy AND the marked amber bars on the strip — they agree.
   */
  countersAtRiskInHorizon: number;
  /** Sourced from projectNextRound — single source of truth shared with NextRoundWatch. */
  cutTarget: number | null;
  /** Index the user would drop to if they hit cutTarget (≈ current − 0.1). */
  ifTheyHitCut: number | null;
  /** Current 8 counters, sorted best → weakest. Empty in building/brand-new. */
  counterCells: CounterCell[];
  /** Number of valid differentials in the last 20. */
  validRoundCount: number;
}

const COUNTER_COUNT = 8;
const TOTAL_WINDOW = 20;
const PROJECTION_HORIZON = 5;
const EWMA_ALPHA = 0.3;
const STEADY_THRESHOLD = 0.2;
const SHARP_THRESHOLD = 0.5;

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function round1(n: number): number {
  return Number(n.toFixed(1));
}

function emptyForecast(state: ForecastState): Forecast {
  return {
    state,
    current: null,
    projected: null,
    delta: null,
    roundsOut: null,
    whenLabel: null,
    expiringCount: 0,
    newCount: 0,
    countersAtRiskInHorizon: 0,
    cutTarget: null,
    ifTheyHitCut: null,
    counterCells: [],
    validRoundCount: 0,
  };
}

/**
 * Exponentially weighted moving average.
 * Inputs are newest-first; the most recent value gets the highest weight.
 */
function ewma(values: number[], alpha: number): number {
  if (values.length === 0) return 0;
  let weighted = 0;
  let weightSum = 0;
  for (let i = 0; i < values.length; i++) {
    const w = Math.pow(1 - alpha, i);
    weighted += values[i] * w;
    weightSum += w;
  }
  return weighted / weightSum;
}

function formatWhenLabel(daysOut: number): string {
  const target = new Date(Date.now() + daysOut * 86_400_000);
  const month = target.toLocaleString('en-GB', { month: 'long' });
  const day = target.getDate();
  if (day <= 10) return `early ${month}`;
  if (day <= 20) return `mid-${month}`;
  return `late ${month}`;
}

export function buildForecast(
  allScores: WhsScore[] | null | undefined,
  currentHandicap: number | null,
  avgRoundCadenceDays: number | null = 7,
): Forecast {
  if (!allScores || allScores.length === 0 || currentHandicap == null) {
    return emptyForecast('brand-new');
  }

  // Window: newest-first, up to 20 rounds.
  const window = allScores.slice(0, TOTAL_WINDOW);
  const windowDiffs = window.map((s) => s.handicap_differential).filter(isNum);

  if (windowDiffs.length < COUNTER_COUNT) {
    return {
      ...emptyForecast('building'),
      current: currentHandicap,
      validRoundCount: windowDiffs.length,
    };
  }

  // ── Current 8 counters (lowest 8 of window) ─────────────────────────
  const sortedByDiff = [...window]
    .filter((s) => isNum(s.handicap_differential))
    .sort((a, b) => (a.handicap_differential as number) - (b.handicap_differential as number));
  const currentCounters = sortedByDiff.slice(0, COUNTER_COUNT);

  // ── Expiring / new / at-risk flags ──────────────────────────────────
  const top5RecentIds = new Set(allScores.slice(0, 5).map((s) => s.id));
  const newCounters = currentCounters.filter((c) => top5RecentIds.has(c.id));

  // 5 oldest rounds in the window — these roll off over the projection horizon.
  const oldestHorizon = window.slice(-PROJECTION_HORIZON);
  const horizonOldestIds = new Set(oldestHorizon.map((s) => s.id));
  const counterIds = new Set(currentCounters.map((c) => c.id));
  const countersAtRiskInHorizon = oldestHorizon.filter((s) => counterIds.has(s.id)).length;

  // ── EWMA projection ─────────────────────────────────────────────────
  // Slice the unfiltered window FIRST so a null in the recent 5 can't silently
  // pull in older rounds.
  const recent5 = window.slice(0, PROJECTION_HORIZON);
  const recent5Diffs = recent5.map((s) => s.handicap_differential).filter(isNum);
  const projDiff = ewma(recent5Diffs, EWMA_ALPHA);

  // ── 5-step rolling-window simulation ────────────────────────────────
  // Operate on diffs only (the projection needs no score metadata).
  // Newest-first → tail is oldest. Each step: pop oldest, unshift projDiff.
  const simDiffs: number[] = windowDiffs.slice();
  for (let step = 0; step < PROJECTION_HORIZON; step++) {
    simDiffs.pop();
    simDiffs.unshift(projDiff);
  }
  const projectedSorted = [...simDiffs].sort((a, b) => a - b);
  const projectedTop8 = projectedSorted.slice(0, COUNTER_COUNT);
  const projectedHandicap = projectedTop8.reduce((s, d) => s + d, 0) / COUNTER_COUNT;
  const delta = projectedHandicap - currentHandicap;

  // ── State classification ────────────────────────────────────────────
  let state: ForecastState;
  if (delta <= -SHARP_THRESHOLD) state = 'sharp-drop';
  else if (delta >= SHARP_THRESHOLD) state = 'sharp-rise';
  else if (Math.abs(delta) <= STEADY_THRESHOLD) state = 'steady';
  else if (delta < 0) state = 'improving';
  else state = 'worsening';

  // ── Cut target (single source of truth) ─────────────────────────────
  // projectNextRound only reads handicap_differential + play_date — the extra
  // WhsScoreWithIndex fields aren't touched, so the cast is safe.
  const next = projectNextRound(window as never, currentHandicap);
  const cutTarget = next.hasData ? next.cutTarget : null;
  const ifTheyHitCut = cutTarget != null ? round1(currentHandicap - 0.1) : null;

  // ── When label ──────────────────────────────────────────────────────
  const cadence = avgRoundCadenceDays ?? 7;
  const whenLabel = formatWhenLabel(PROJECTION_HORIZON * cadence);

  return {
    state,
    current: currentHandicap,
    projected: round1(projectedHandicap),
    delta: round1(delta),
    roundsOut: PROJECTION_HORIZON,
    whenLabel,
    expiringCount: countersAtRiskInHorizon,
    newCount: newCounters.length,
    countersAtRiskInHorizon,
    cutTarget,
    ifTheyHitCut,
    counterCells: currentCounters.map((c, i) => ({
      score: c,
      differential: c.handicap_differential as number,
      rank: i,
      isExpiring: horizonOldestIds.has(c.id),
      isNew: top5RecentIds.has(c.id),
    })),
    validRoundCount: windowDiffs.length,
  };
}
