import type { WhsRecentRound } from '@/lib/whs/types';

export interface RoundWithDelta extends WhsRecentRound {
  /**
   * Handicap movement caused by this round, in strokes.
   * Negative = handicap dropped (improvement).
   * Positive = handicap went up.
   * 0 = unchanged.
   * null = no previous round to compare against, OR this round is not a counter.
   */
  handicap_delta: number | null;
}

/**
 * Walks a list of WhsRecentRound (newest-first) and assigns each round its delta.
 * Delta is `(thisRound.index − previousRound.index)` in time order.
 * Non-counter rounds get null.
 */
export function computeRoundDeltas(rounds: WhsRecentRound[]): RoundWithDelta[] {
  const ascending = [...rounds].sort(
    (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
  );

  const deltas = new Map<string, number | null>();

  for (let i = 0; i < ascending.length; i++) {
    const round = ascending[i];
    const previous = i > 0 ? ascending[i - 1] : null;

    if (
      !round.is_counter ||
      !previous ||
      round.handicap_index_at_time === null ||
      previous.handicap_index_at_time === null
    ) {
      deltas.set(round.id, null);
      continue;
    }

    const delta = Number(
      (round.handicap_index_at_time - previous.handicap_index_at_time).toFixed(1),
    );
    deltas.set(round.id, delta);
  }

  return rounds.map((r) => ({
    ...r,
    handicap_delta: deltas.get(r.id) ?? null,
  }));
}
