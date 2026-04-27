/**
 * Centralized route helpers for the Tour Hub feature.
 *
 * Use these instead of inline string concat so URL shapes change in one place.
 */

const COLLEGE_HUB = '/tourhub/college-golf';

export function collegeHubRoute(): string {
  return COLLEGE_HUB;
}

export function collegeProfileRoute(slug: string): string {
  return `${COLLEGE_HUB}/${slug}`;
}

/**
 * Head-to-head comparison page. Uses the existing query-param route shape
 * (?c1=&c2=) — see CollegeComparePage. Path-param routing is a Phase 2 lever.
 */
export function collegeH2HRoute(c1: string, c2?: string): string {
  if (!c2) return `${COLLEGE_HUB}/compare?c1=${encodeURIComponent(c1)}`;
  return `${COLLEGE_HUB}/compare?c1=${encodeURIComponent(c1)}&c2=${encodeURIComponent(c2)}`;
}
