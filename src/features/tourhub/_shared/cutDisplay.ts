/**
 * resolveCutDisplay — single source of truth for which cut figure a surface
 * may show.
 *
 * Hard rule: NEVER display projected_cutline once current_round > cut_round.
 * Sportradar leaves stale projections behind (e.g. Utah 2026 held
 * projected_cutline = 0 against an actual cutline of -6), so the projection is
 * only trustworthy while the cut round is still being played.
 */

export interface CutInput {
  status?: string | null;
  currentRound?: number | null;
  cutRound?: number | null;
  cutline?: number | null;
  projectedCutline?: number | null;
}

export type CutDisplayKind = 'none' | 'actual' | 'projected';

export interface CutDisplay {
  kind: CutDisplayKind;
  cutline: number | null;
}

function isFinished(status: string): boolean {
  return status === 'closed' || status === 'completed' || status === 'complete';
}

/** True once the cut has landed — actual figures only from here on. */
export function cutHasHappened(input: CutInput): boolean {
  const status = (input.status ?? '').toLowerCase();
  const { currentRound, cutRound } = input;
  if (cutRound != null && currentRound != null && currentRound > cutRound) return true;
  return isFinished(status);
}

/** True only while the cut round itself is in play — projections allowed. */
export function projectionIsLive(input: CutInput): boolean {
  if (cutHasHappened(input)) return false;
  const { currentRound, cutRound } = input;
  return cutRound != null && currentRound != null && currentRound === cutRound;
}

export function resolveCutDisplay(input: CutInput): CutDisplay {
  if (cutHasHappened(input) && input.cutline != null) {
    return { kind: 'actual', cutline: input.cutline };
  }
  if (projectionIsLive(input) && input.projectedCutline != null) {
    return { kind: 'projected', cutline: input.projectedCutline };
  }
  return { kind: 'none', cutline: null };
}
