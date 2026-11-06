/** Sponsor-only print rules preserve the canonical profile Career derivation.
 * Text measurement is injected so the browser uses its actual app font. */
import type { CareerEntry } from './proCollectionRules';

export function truncateSponsorEvent(name: string, width: number, measureText: (text: string) => { width: number }): string {
  if (measureText(name).width <= width) return name;
  if (measureText('…').width > width) return '';
  const letters = Array.from(name);
  let low = 0;
  let high = letters.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (measureText(`${letters.slice(0, mid).join('')}…`).width <= width) low = mid;
    else high = mid - 1;
  }
  return `${letters.slice(0, low).join('').trimEnd()}…`;
}

export function sponsorCareerEntries(entries: CareerEntry[]): CareerEntry[] {
  return entries.filter((entry) => !(entry.derived && entry.kind === 3))
    .slice(0, 4)
    .map((entry) => entry.derived && entry.kind === 0
      ? { ...entry, text: entry.text.replace(/, after .*$/, '') }
      : entry);
}