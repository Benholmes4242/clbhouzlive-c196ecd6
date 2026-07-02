/**
 * fetchpriority contract — single source of truth (Phase 6).
 *
 *  high  → above-fold / current-focused REAL image (LCP candidate,
 *          hero, first row of a rail/grid). At most ONE per viewport class.
 *  auto  → below-fold real image (browser decides w/ lazy-load + viewport).
 *  low   → LQIP underlays, speculative prefetch, decorative icons.
 *
 * Rule: never hand-write `fetchpriority="…"` literals anywhere else in the
 * codebase. Import from here — the ESLint `no-restricted-syntax` rule bans
 * the literals outside this file so the contract cannot drift.
 */

export type Priority = 'high' | 'auto' | 'low';

/** Real tile in a grid/rail. Top 3 are effectively above-fold on mobile. */
export function tilePriority(indexInViewport: number, isLcp = false): Priority {
  if (isLcp) return 'high';
  return indexInViewport < 3 ? 'high' : 'auto';
}

/** LQIP blur underlays: always low — fetch now, never compete. */
export const LQIP_PRIORITY: Priority = 'low';

/** Speculative HLS/poster prefetch: always low. */
export const SPECULATIVE_PRIORITY: Priority = 'low';

/** Decorative icons (medals, badges): always low. */
export const DECORATIVE_PRIORITY: Priority = 'low';
