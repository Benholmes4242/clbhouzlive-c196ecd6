/**
 * fmtToPar — integer to-par notation for feed chrome: 'E' at level, '+n' over,
 * a TRUE MINUS under, an em dash when there is nothing to print.
 *
 * Lifted out of PostRoundCard when that card was deleted (round posts have no
 * Clubhouse home). FeedCard's own header score line still needs it, so the
 * helper moved here rather than being copied.
 */
export function fmtToPar(n: number | null): string {
  if (n == null) return '—';
  return n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`;
}
