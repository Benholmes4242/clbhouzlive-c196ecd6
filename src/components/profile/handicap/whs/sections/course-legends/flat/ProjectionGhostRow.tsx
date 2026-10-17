/** Placement only. Rendering belongs exclusively to FlatBoardRow's variant. */
export function ghostInsertionIndex(rows: readonly { value: number }[], value: number): number {
  // All projectable categories are lower-is-better. Equal real scores stay first.
  const index = rows.findIndex(row => row.value > value);
  return index < 0 ? rows.length : index;
}