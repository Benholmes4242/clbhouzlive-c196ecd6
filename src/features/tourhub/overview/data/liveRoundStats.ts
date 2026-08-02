/**
 * liveRoundStats — pure derivations for the live rail's stat band.
 *
 * All three read the leaderboard entries the page already has loaded (no
 * extra network). Round-to-par figures come from round_1..round_4 on the
 * active round only — never a fallback to the previous round.
 *
 *  - fieldAverageToday : average round-to-par across players who have
 *                        COMPLETED the active round. Gated: null below
 *                        FIELD_GATE completed rounds (no provisional figure).
 *  - lowRoundToday     : best (lowest) round-to-par of the day, plus how
 *                        many players share it.
 *  - topMoverToday     : biggest places-gained delta, via movementFromRounds.
 */

import type { BoardEntry } from '../../hooks/useTourHubData';
import { movementFromRounds } from '../../leaderboard/movementFromRounds';

export const FIELD_GATE = 20;

const DEMOTED = new Set(['MC', 'CUT', 'WD', 'DQ', 'MDF', 'DNS']);

function isDemoted(status: string | null | undefined): boolean {
  return !!status && DEMOTED.has(status.toUpperCase());
}

function roundValue(e: BoardEntry, round: number): number | null {
  const v = [e.round_1, e.round_2, e.round_3, e.round_4][round - 1];
  return v == null ? null : (v as number);
}

export interface FieldAverage {
  avg: number;
  count: number;
}

export function fieldAverageToday(
  entries: BoardEntry[],
  round: number | null | undefined,
): FieldAverage | null {
  if (round == null || round < 1 || round > 4) return null;
  let sum = 0;
  let count = 0;
  for (const e of entries) {
    const v = roundValue(e, round);
    if (v == null) continue;
    if (e.thru != null && e.thru < 18) continue;
    sum += v;
    count += 1;
  }
  if (count < FIELD_GATE) return null;
  return { avg: sum / count, count };
}

export interface LowRound {
  toPar: number;
  playerName: string;
  playerId: string | null;
  /** How many players are tied on this figure (1 = outright). */
  tied: number;
}

export function lowRoundToday(
  entries: BoardEntry[],
  round: number | null | undefined,
): LowRound | null {
  if (round == null || round < 1 || round > 4) return null;
  let best: LowRound | null = null;
  let tied = 0;
  for (const e of entries) {
    if (isDemoted((e as any).status)) continue;
    const v = roundValue(e, round);
    if (v == null) continue;
    // Only completed rounds count as "low round of the day".
    if (e.thru != null && e.thru < 18) continue;
    const player = (e as any).player as { id?: string; full_name?: string } | null | undefined;
    const name = player?.full_name ?? '';
    if (!best || v < best.toPar) {
      best = { toPar: v, playerName: name, playerId: player?.id ?? null, tied: 1 };
      tied = 1;
    } else if (v === best.toPar) {
      tied += 1;
    }
  }
  if (!best) return null;
  return { ...best, tied };
}

export interface TopMover {
  places: number;
  playerName: string;
  playerId: string | null;
}

export function topMoverToday(
  entries: BoardEntry[],
  round: number | null | undefined,
): TopMover | null {
  const deltas = movementFromRounds(
    entries.map((e) => ({
      id: (e as any).id,
      playerId: (e as any).player_id ?? (e as any).player?.id ?? null,
      position: e.position,
      status: (e as any).status ?? null,
      round_1: e.round_1,
      round_2: e.round_2,
      round_3: e.round_3,
      round_4: e.round_4,
    })),
    round,
  );
  let bestId: string | null = null;
  let bestPlaces = 0;
  deltas.forEach((places, playerId) => {
    if (places > bestPlaces) {
      bestPlaces = places;
      bestId = playerId;
    }
  });
  if (!bestId || bestPlaces <= 0) return null;
  const row = entries.find(
    (e) => ((e as any).player_id ?? (e as any).player?.id) === bestId,
  );
  const player = row ? ((row as any).player as { id?: string; full_name?: string } | null) : null;
  return {
    places: bestPlaces,
    playerName: player?.full_name ?? '',
    playerId: player?.id ?? bestId,
  };
}

/** "+1.4" / "−0.6" / "E" — to-par convention, tabular safe. */
export function formatToParAvg(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r > 0) return `+${r.toFixed(1)}`;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(1)}`;
  return 'E';
}

/** "-6" / "+2" / "E" — whole round-to-par. */
export function formatToPar(v: number): string {
  if (v === 0) return 'E';
  return v < 0 ? String(v) : `+${v}`;
}

/** "P. Cantlay" — matches the tour side-menu short-name convention. */
export function shortPlayerName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return full;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}
