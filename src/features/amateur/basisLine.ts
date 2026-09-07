/**
 * THE BASIS LINE (BRIEF_AMATEUR_PAGE).
 *
 * Blocks 1 and 2 are governed by the page filter; blocks 3 and 4 are not, and
 * nothing else on the page marks that boundary. So the count line on the
 * filtered blocks STATES ITS SAMPLE - "19 members · 14 days" - and the
 * unfiltered blocks state none. The presence or absence of a basis IS the
 * boundary; no divider, no sentence, no second filter.
 *
 * IT STAYS ONE LINE at 390pt, so the scope is only named when it narrows the
 * pool, and then in its shortest form: "circle", "club". "Everyone" is the
 * whole pool and says nothing worth a word.
 */
import { WINDOW_SHORT, type BoardFilters } from '@/components/explore-tab-new/courseled/boardFilters';

type T = (key: string, fallback?: string) => string;

const SCOPE_SHORT: Partial<Record<BoardFilters['scope'], { i18n: string; label: string }>> = {
  circle: { i18n: 'discover.filterBoard.scopeShort.circle', label: 'circle' },
  club: { i18n: 'discover.filterBoard.scopeShort.club', label: 'club' },
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
