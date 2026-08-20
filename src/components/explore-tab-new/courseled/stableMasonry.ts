/**
 * STABLE MASONRY PLACEMENT (BRIEF_DISCOVER_REFRESH_POLICY §4).
 *
 * `splitMasonry` is a greedy walk: each tile goes into whichever column is
 * currently shorter. That is the right ANSWER for a first paint and the wrong
 * BEHAVIOUR for a refetch, because column choice depends on every tile before
 * it. Around the world sorts by relevance then notability then recency, so a
 * new event usually lands at or near rank 0 — which flips the parity of the
 * whole walk. Measured with the real ATW_PHOTO_HEIGHTS and six tiles, one
 * top-rank arrival moved FOUR of the five surviving tiles to the other column:
 *
 *   before  col0 [A, D, F]   col1 [B, C, E]
 *   after   col0 [NEW, C, E] col1 [A, B, D]
 *
 * The fix is not to refetch less often — the focus refetch is deliberate and
 * the new-since rings exist precisely so content can arrive without the page
 * moving. The fix is to make column choice a property of the TILE rather than
 * of its position in the list: a tile placed in the left column stays in the
 * left column for as long as it is on the page, and only tiles the member has
 * never seen are placed greedily.
 *
 * NOT SOLVED HERE, deliberately: photo height is a pure function of RANK
 * POSITION (ATW_PHOTO_HEIGHTS), so a new top-rank arrival still pushes each
 * surviving tile down one size step. That is the notability rule and it is out
 * of this brief's scope; the horizontal jump was the churn worth fixing.
 */

export interface MasonryAssignment {
  /** slotKey -> column index. Survives across refetches, per mounted section. */
  byKey: Map<string, number>;
}

export function createMasonryAssignment(): MasonryAssignment {
  return { byKey: new Map() };
}

/**
 * Places `tiles` into two columns, honouring any column a tile was already
 * given. Pure with respect to its inputs; `assignment` is mutated so the
 * caller can hold it in a ref for the life of the section.
 *
 * Keys that are no longer on the page are dropped, so a tile that leaves and
 * later returns is placed fresh rather than resurrecting a stale column.
 */
export function placeStable<T extends { slotKey: string; height: number }>(
  tiles: readonly T[],
  assignment: MasonryAssignment,
): { columns: T[][] } {
  const columns: T[][] = [[], []];
  const totals = [0, 0];

  const push = (col: number, tile: T) => {
    columns[col].push(tile);
    totals[col] += tile.height + (columns[col].length > 1 ? 8 : 0);
  };

  // Known tiles first, so the greedy step for new arrivals measures against
  // the columns as the member is currently seeing them.
  const fresh: T[] = [];
  for (const tile of tiles) {
    const col = assignment.byKey.get(tile.slotKey);
    if (col === 0 || col === 1) push(col, tile);
    else fresh.push(tile);
  }

  for (const tile of fresh) push(totals[0] <= totals[1] ? 0 : 1, tile);

  // Rewrite the map from what is actually on the page.
  assignment.byKey.clear();
  columns.forEach((col, ci) => col.forEach((tile) => assignment.byKey.set(tile.slotKey, ci)));

  return { columns };
}

/** Records a post-de-clash layout so the repair itself does not churn later. */
export function rememberColumns<T extends { slotKey: string }>(
  columns: readonly T[][],
  assignment: MasonryAssignment,
): void {
  assignment.byKey.clear();
  columns.forEach((col, ci) => col.forEach((tile) => assignment.byKey.set(tile.slotKey, ci)));
}

/**
 * SHORTEST-COLUMN PLACEMENT. Walk the ranked list in order, put each tile in
 * whichever column is currently shorter by TOTAL rendered height (photo +
 * panel + the 8px gap), tie to the left. Pure and deterministic.
 *
 * KNOWN AND ACCEPTED: visual order is therefore not strictly rank order. That
 * is inherent to masonry. Alternating strictly left/right instead would leave
 * one column consistently longer on every render.
 */
export function splitMasonry<T>(items: T[], heightOf: (item: T, index: number) => number) {
  const cols: T[][] = [[], []];
  const totals = [0, 0];
  items.forEach((item, i) => {
    const c = totals[0] <= totals[1] ? 0 : 1;
    cols[c].push(item);
    totals[c] += heightOf(item, i) + (cols[c].length > 1 ? 8 : 0);
  });
  return { columns: cols, totals };
}
