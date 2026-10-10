import {
  BAND_OPTIONS,
  COMPETITION_OPTIONS,
  COURSES_SET_OPTIONS,
  SCOPE_OPTIONS,
  WINDOW_OPTIONS,
  type BoardFilters,
} from './boardFilters';

/* Extracted from the retired GolfThisWeek component (Phase 3.2), unchanged. */
/**
 * S5.2 — THE APPLIED LINE. Prose, not chips: "Everyone, last 14 days" reads as a
 * sentence a member can check, and every non-default axis appears in it.
 */
export function describeFilterParts(
  f: BoardFilters,
  t: (k: string, d?: string, o?: object) => string,
): string[] {
  const parts: string[] = [];
  const scope = SCOPE_OPTIONS.find((o) => o.key === f.scope);
  if (scope) parts.push(t(scope.i18n, scope.label));
  const win = WINDOW_OPTIONS.find((o) => o.key === f.window);
  if (win) parts.push(t(win.i18n, win.label));
  if (f.regionValue) parts.push(f.regionValue);
  if (f.courses === 'one') parts.push(t('discover.filterBoard.courses.oneCourse', 'one course'));
  else if (f.courses !== 'any') {
    const c = COURSES_SET_OPTIONS.find((o) => o.key === f.courses);
    if (c) parts.push(t(c.i18n, c.label));
  }
  if (f.band !== 'any') {
    const b = BAND_OPTIONS.find((o) => o.key === f.band);
    if (b) parts.push(t(b.i18n, b.label));
  }
  /* B3.4 — COMPETITION JOINS THE APPLIED LINE when set. */
  if (f.competition !== 'any') {
    const c = COMPETITION_OPTIONS.find((o) => o.key === f.competition);
    if (c) parts.push(t(c.i18n, c.label));
  }
  return parts;
}

export function describeFilters(
  f: BoardFilters,
  t: (k: string, d?: string, o?: object) => string,
): string {
  return describeFilterParts(f, t).join(' \u00B7 ');
}

