/**
 * fmtScore — THE score formatter for Tour surfaces. One formatter: a to-par
 * figure prints a true minus (U+2212), never a hyphen; E at level; +N over.
 * A local copy of this function is a fork — import it instead.
 *
 * `absent` states what a missing figure renders as. The default is 'E'; a
 * tabular board that must show an empty cell passes `{ absent: '' }`.
 */
export function fmtScore(n: number | null | undefined, opts: { absent?: string } = {}): string {
  if (n === null || n === undefined || Number.isNaN(n)) return opts.absent ?? 'E';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;
}
