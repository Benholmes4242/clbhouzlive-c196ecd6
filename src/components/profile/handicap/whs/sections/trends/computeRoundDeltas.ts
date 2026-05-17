import type { WhsScoreWithIndex } from '@/lib/whs/types';

export interface RoundWithDelta extends WhsScoreWithIndex {
  /**
   * Handicap movement caused by this round, in strokes.
   * Negative = handicap dropped (improvement / a cut).
   * Positive = handicap went up.
   * 0 = unchanged.
   * null = no following round AND no current snapshot, OR round not a counter.
   */
  handicap_delta: number | null;
}

/**
 * Walks a list of WhsScoreWithIndex (newest-first) and assigns each round its
 * delta. Delta is computed as `(post - pre)` where:
 *   - pre = thisRound.handicap_index_at_time
 *   - post = the NEXT chronological round's handicap_index_at_time
 *         OR currentSnapshot (for the newest round, if provided)
 *
 * For non-counter rounds the delta is set to null.
 */
export function computeRoundDeltas(
  rounds: WhsScoreWithIndex[],
  currentSnapshot?: number | null,
): RoundWithDelta[] {
  const ascending = [...rounds].sort(
    (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
  );

  const deltas = new Map<string, number | null>();

  for (let i = 0; i < ascending.length; i++) {
    const round = ascending[i];
    const isNewest = i === ascending.length - 1;
    const nextRound = isNewest ? null : ascending[i + 1];

    if (!round.is_counter || round.handicap_index_at_time === null) {
      deltas.set(round.id, null);
      continue;
    }

    let post: number | null = null;
    if (nextRound && nextRound.handicap_index_at_time !== null) {
      post = Number(nextRound.handicap_index_at_time);
    } else if (isNewest && currentSnapshot != null) {
      post = Number(currentSnapshot);
    }

    if (post === null) {
      deltas.set(round.id, null);
      continue;
    }

    const delta = Number(
      (post - Number(round.handicap_index_at_time)).toFixed(1),
    );
    deltas.set(round.id, delta);
  }

  return rounds.map((r) => ({
    ...r,
    handicap_delta: deltas.get(r.id) ?? null,
  }));
}
