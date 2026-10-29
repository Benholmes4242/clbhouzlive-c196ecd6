/**
 * The ONE "has started" rule for Tour overview copy. A board row has started
 * when it carries a finite score for any of round_1..round_4, or a thru of 1
 * or more for the current round. Before the first tee time the feed carries a
 * 0 score for every player, so a numeric score alone never means "on the
 * board". Copy that claims a lead, a tie or a movement reads only started
 * rows; the board, the hero pill and the round dots keep their own rules.
 */
type StartRow = {
  round_1?: number | null; round_2?: number | null; round_3?: number | null; round_4?: number | null;
  thru?: number | null;
};

export function rowHasStarted(row: StartRow | null | undefined): boolean {
  if (!row) return false;
  for (const key of ['round_1', 'round_2', 'round_3', 'round_4'] as const) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return true;
  }
  return typeof row.thru === 'number' && Number.isFinite(row.thru) && row.thru >= 1;
}

export function fieldHasStarted(rows: ReadonlyArray<StartRow> | null | undefined): boolean {
  return Array.isArray(rows) && rows.some(rowHasStarted);
}

/** Earliest tee time in a round's groups, or null when none is known. */
export function earliestTeeTime(groups: ReadonlyArray<{ teeTime?: string | null }> | null | undefined): string | null {
  let best: string | null = null;
  let bestMs = Infinity;
  for (const g of groups ?? []) {
    const ms = g?.teeTime ? Date.parse(g.teeTime) : NaN;
    if (Number.isFinite(ms) && ms < bestMs) { bestMs = ms; best = g.teeTime as string; }
  }
  return best;
}
