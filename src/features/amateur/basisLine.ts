/**
 * THE BASIS LINE (BRIEF_AMATEUR_PAGE).
 *
 * Blocks 1 and 2 are governed by the page filter; blocks 3 and 4 are not, and
 * nothing else on the page marks that boundary. So the count line on the
 * filtered blocks STATES ITS SAMPLE - "19 members · 14 days" - and the
 * unfiltered blocks state none. The presence or absence of a basis IS the
 * boundary; no divider, no sentence, no second filter.
 *
 * IT STAYS ONE LINE at 390pt. Measured: the widest case, "Bogey-free rounds"
 * beside "1,234 members - your circle - this year", is 354px inside 362px of
 * usable width, so the scope is named in the FILTER'S OWN WORDS ("your circle",
 * "your club") rather than clipped to a system field. "Everyone" is the whole
 * pool and says nothing worth a word.
 */
import { WINDOW_SHORT, type BoardFilters } from '@/components/explore-tab-new/courseled/boardFilters';

type T = (key: string, fallback?: string) => string;

const SCOPE_SHORT: Partial<Record<BoardFilters['scope'], { i18n: string; label: string }>> = {
  circle: { i18n: 'discover.filterBoard.scope.circle', label: 'Your circle' },
  club: { i18n: 'discover.filterBoard.scope.club', label: 'Your club' },
};

/** `unit` is the already-pluralised count ("19 members", "10 courses"). */
export function basisLine(unit: string, filters: BoardFilters, t: T): string {
  const parts = [unit];
  const scope = SCOPE_SHORT[filters.scope];
  if (scope) parts.push(t(scope.i18n, scope.label).toLowerCase());
  const window = WINDOW_SHORT[filters.window];
  parts.push(t(window.i18n, window.label).toLowerCase());
  return parts.join(' \u00B7 ');
}
