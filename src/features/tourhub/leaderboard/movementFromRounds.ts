/**
 * movementFromRounds — compute start-of-round positions from prior
 * round strokes and derive per-player position deltas.
 *
 * Ranking convention: STANDARD COMPETITION (ties share a rank, the
 * next rank skips: 1, 2, 2, 4).
 *
 * Rules:
 *   - Empty map when currentRound <= 1 or null (R1 has no prior).
 *   - Only players with ALL rounds 1..currentRound-1 non-null are
 *     ranked; anyone missing a prior round gets no delta.
 *   - CUT / WD / DQ / MC / MDF / DNS rows: never receive a delta
 *     (caller enforces via `isDemoted`; this util also skips them
 *     during ranking so a mid-tournament WD doesn't distort start
 *     positions).
 *   - delta = priorPosition - currentPosition. Positive = climbed.
 *
 * Pure — no React, no supabase.
 */

export interface MovementRowInput {
  id: string;
  playerId: string | null | undefined;
  position: number | null | undefined;
  status: string | null | undefined;
  round_1: number | null | undefined;
  round_2: number | null | undefined;
  round_3: number | null | undefined;
  round_4: number | null | undefined;
}

const DEMOTED = new Set(['MC', 'CUT', 'WD', 'DQ', 'MDF', 'DNS']);

function isDemotedStatus(s: string | null | undefined): boolean {
  if (!s) return false;
  return DEMOTED.has(s.toUpperCase());
}

export function movementFromRounds(
  rows: MovementRowInput[],
  currentRound: number | null | undefined,
): Map<string, number> {
  const out = new Map<string, number>();
  if (!currentRound || currentRound <= 1) return out;

  const priorCount = currentRound - 1;

  // Collect candidates with a full prior-round history and a valid
  // current position, excluding demoted rows entirely.
  const candidates: Array<{ playerId: string; priorTotal: number; currentPos: number }> = [];
  for (const r of rows) {
    if (!r.playerId) continue;
    if (isDemotedStatus(r.status)) continue;
    if (r.position == null) continue;
    const rs = [r.round_1, r.round_2, r.round_3, r.round_4];
    const priors = rs.slice(0, priorCount);
    if (priors.some((v) => v == null)) continue;
    const priorTotal = priors.reduce<number>((acc, v) => acc + (v as number), 0);
    candidates.push({ playerId: r.playerId, priorTotal, currentPos: r.position });
  }

  if (candidates.length === 0) return out;

  // Standard-competition ranking on ascending priorTotal.
  const sorted = [...candidates].sort((a, b) => a.priorTotal - b.priorTotal);
  const priorRankByPlayer = new Map<string, number>();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].priorTotal === sorted[i].priorTotal) {
      j++;
    }
    const rank = i + 1; // 1-indexed; ties share, next rank skips.
    for (let k = i; k <= j; k++) {
      priorRankByPlayer.set(sorted[k].playerId, rank);
    }
    i = j + 1;
  }

  for (const c of candidates) {
    const prior = priorRankByPlayer.get(c.playerId);
    if (prior == null) continue;
    const delta = prior - c.currentPos;
    out.set(c.playerId, delta);
  }

  return out;
}
