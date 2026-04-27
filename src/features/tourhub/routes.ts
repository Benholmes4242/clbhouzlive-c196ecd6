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

// ─────────────────────────────────────────────────────────────────────────────
// Tournament detail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discriminated union describing where the user came from when navigating to
 * the tournament detail page. Drives the back-link label
 * ("Back to Schedule", "Back to Clubhouse", etc.).
 *
 * Top-5 entry points migrated in Phase 1; remaining 18 fall back to plain
 * "Back" (handled by getReferrerLabel(undefined)).
 */
export type TournamentReferrer =
  | { kind: 'schedule' }
  | { kind: 'overview' }
  | { kind: 'clubhouse' }
  | { kind: 'player'; playerName: string }
  | { kind: 'college'; collegeName: string };

export interface TournamentNavTarget {
  to: string;
  state: { referrer?: TournamentReferrer };
}

/**
 * Build a navigation target for the tournament detail page. Pass the result
 * to <Link to={target.to} state={target.state}> or
 * navigate(target.to, { state: target.state }).
 */
export function tournamentRoute(
  tournamentId: string,
  referrer?: TournamentReferrer,
): TournamentNavTarget {
  return {
    to: `/tourhub/tournament/${tournamentId}`,
    state: { referrer },
  };
}

/**
 * Resolve the back-link label from a referrer. Returns "Back" when no
 * referrer is supplied (deep-link visit, or non-migrated entry point).
 */
export function getReferrerLabel(referrer?: TournamentReferrer): string {
  if (!referrer) return 'Back';
  switch (referrer.kind) {
    case 'schedule':
      return 'Back to Schedule';
    case 'overview':
      return 'Back to Tour Hub';
    case 'clubhouse':
      return 'Back to Clubhouse';
    case 'player':
      return `Back to ${referrer.playerName}`;
    case 'college':
      return `Back to ${referrer.collegeName}`;
  }
}

