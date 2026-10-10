/**
 * whatsNext — pure rules for the Phase 4 "what to watch next" bands on the
 * Tour overview hero: the required round in PicksSheet and the next-round
 * leaders' tee time. No React, no network: callers pass what they have.
 */
import type { TeeGroup } from '../../../tournament-v2/data/useTeeTimesAll';

/**
 * THE 59 FLOOR — DO NOT REMOVE. A sub-60 round is a historic event in
 * professional golf, so a required round below 59 presents an impossibility as
 * a plan. A pick that far back is not coming back; the honest output is
 * nothing, not a number that insults the reader. This guard is deliberate,
 * not an off-by-one to "fix".
 */
export const MIN_TARGET_ROUND = 59;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Gross round a pick needs to reach the leader's total.
 * Needed gross = venue par + (leader to-par − pick to-par). Totals are to-par.
 * Null when any input is missing, when the pick leads or is level, or when
 * the figure falls below MIN_TARGET_ROUND.
 */
export function neededGross(
  venuePar: number | null | undefined,
  leaderTotal: number | null | undefined,
  pickTotal: number | null | undefined,
): number | null {
  if (!isNum(venuePar) || !isNum(leaderTotal) || !isNum(pickTotal)) return null;
  if (pickTotal <= leaderTotal) return null; // leads or level — nothing to need
  const gross = venuePar + (leaderTotal - pickTotal);
  if (gross < MIN_TARGET_ROUND) return null;
  return gross;
}

/**
 * THE REQUIRED-ROUND WINDOW. A required round score is only a true statement
 * when exactly one full round remains: a gap spread over two or more rounds
 * is not a single round score, and a gap measured once the final round is
 * under way is a part-round figure wearing a full-round label. So the line
 * lives in the penultimate round only (on a four-round event, Saturday).
 */
export function inRequiredRoundWindow(
  currentRound: number | null | undefined,
  totalRounds: number,
): boolean {
  return isNum(currentRound) && currentRound === totalRounds - 1;
}

/** Lowest to-par among the board's leading row; the leader's total. */
export function leaderOf(
  entries: Array<{ position?: number | null; score?: number | null; player?: { id?: string | null } | null }>,
): { playerId: string | null; total: number | null } | null {
  let best: (typeof entries)[number] | null = null;
  for (const e of entries) {
    if (e.position == null) continue;
    if (!best || (e.position as number) < (best.position as number)) best = e;
  }
  if (!best) return null;
  return { playerId: best.player?.id ? String(best.player.id) : null, total: isNum(best.score) ? best.score : null };
}

/**
 * The next round, only when it has a published draw. Final round (or a
 * round the draw does not contain) → null. A draw is the test, never a date.
 */
export function nextDrawnRound(
  currentRound: number | null | undefined,
  drawnRounds: number[] | null | undefined,
  totalRounds: number,
): number | null {
  if (!isNum(currentRound)) return null;
  const next = currentRound + 1;
  if (next > totalRounds) return null;
  return (drawnRounds ?? []).includes(next) ? next : null;
}

/** Whether a next round can exist at all — gates the draw query itself. */
export function hasNextRound(currentRound: number | null | undefined, totalRounds: number): boolean {
  return isNum(currentRound) && currentRound >= 1 && currentRound < totalRounds;
}

/** The group containing the leader, by player id — never "last off". */
export function leaderGroup(groups: TeeGroup[] | null | undefined, leaderPlayerId: string | null | undefined): TeeGroup | null {
  if (!leaderPlayerId) return null;
  for (const g of groups ?? []) {
    if (g.players.some((p) => p.id != null && String(p.id) === String(leaderPlayerId))) return g;
  }
  return null;
}
