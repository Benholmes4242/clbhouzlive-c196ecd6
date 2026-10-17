/** Field-only derivations: no viewer index/projection, no history invented from snapshots. */
export function cabinetHolderName(names: readonly string[]): string {
  const parts = names.map(name => name.trim().split(/\s+/).filter(Boolean));
  const surname = (words: string[]) => words[words.length - 1] ?? 'Player';
  if (parts.length === 0) return '';
  if (parts.length === 2) return `${surname(parts[0])} & ${surname(parts[1])}`;
  if (parts.length > 2) return `${surname(parts[0])} +${parts.length - 1}`;
  const words = parts[0];
  return words.length > 1 ? `${words[0][0]}. ${surname(words)}` : surname(words);
}

export function fieldRecordComparison(record: number | null, par: number | null, fieldOverPar: number | null, rounds: number | null) {
  if (record == null || par == null || fieldOverPar == null || rounds == null || rounds <= 0) return null;
  if (![record, par, fieldOverPar, rounds].every(Number.isFinite)) return null;
  const fieldGross = par + fieldOverPar;
  return { record, par, fieldOverPar, fieldGross, gap: fieldGross - record, rounds, recordToPar: record - par };
}