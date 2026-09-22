// BRIEF_LEGEND_JOINT_RANKS — joint ranks on course legend boards.
//
// public.gam_course_legends.rank used to be assigned positionally (`i + 1`) in
// two places — the write-skip signature and the board insert — so equal values
// received different ranks and which player got the better one was decided by a
// sort order nobody can see. A shared course record displayed as a defeat.
//
// Standard competition ranking ("1224"): equal values share the LOWER rank and
// the next distinct value skips accordingly (1, 1, 3, 4).
//
// PRECISION: equality is tested at the SAME precision legendBoardSignature
// already normalises to — Number(value).toFixed(6). `value` is unconstrained
// numeric arriving back through PostgREST as a JSON number, so two genuinely
// equal scores must never be split by floating-point noise. Never `===`.
//
// The sort order itself is NOT touched here — callers pass an already-sorted
// array and only the rank numbers are produced.

/** The 6-decimal comparison key, identical to legendBoardSignature's. */
export function valueKey(value: unknown): string {
  return Number(value).toFixed(6);
}

/**
 * Standard competition ranking over an already-sorted array.
 * Returns the same rows in the same order, each with its rank.
 */
export function assignCompetitionRanks<T extends { value: unknown }>(
  rows: readonly T[],
): Array<T & { rank: number }> {
  let rank = 0;
  let prevKey: string | null = null;
  return rows.map((r, i) => {
    const key = valueKey(r.value);
    if (prevKey === null || key !== prevKey) {
      rank = i + 1; // distinct value -> its positional rank; ties skip accordingly
      prevKey = key;
    }
    return { ...r, rank };
  });
}

export interface CrownSetDelta {
  /** rank-1 holders in the new board that were not rank-1 before. */
  earned: string[];
  /** rank-1 holders in the old board that are no longer rank-1. */
  lost: string[];
  /** rank-1 holders on both boards — told NOTHING. */
  retained: string[];
}

/**
 * Set-based crown diff. With joint ranks a board can have several rank-1
 * holders, so a single element cannot represent the top of the board.
 * A member who keeps a share of the record has neither earned nor lost.
 */
export function crownSetDelta(
  prevRows: ReadonlyArray<{ user_id: string; rank: number }> | null | undefined,
  nextRows: ReadonlyArray<{ user_id: string; rank: number }> | null | undefined,
): CrownSetDelta {
  const prevTop = new Set((prevRows ?? []).filter((r) => Number(r.rank) === 1).map((r) => r.user_id));
  const nextTop = new Set((nextRows ?? []).filter((r) => Number(r.rank) === 1).map((r) => r.user_id));
  const earned: string[] = [];
  const lost: string[] = [];
  const retained: string[] = [];
  for (const id of nextTop) (prevTop.has(id) ? retained : earned).push(id);
  for (const id of prevTop) if (!nextTop.has(id)) lost.push(id);
  return { earned, lost, retained };
}
