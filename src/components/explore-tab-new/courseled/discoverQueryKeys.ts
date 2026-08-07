/**
 * DISCOVER INVALIDATION KEYS (BRIEF_DISCOVER_REFRESH_POLICY §3).
 *
 * Nothing on Discover polls. Freshness for the member's OWN contribution comes
 * from precise invalidation instead: post a review, open Discover, see it.
 * That is what lets every staleTime on the page be LONGER rather than shorter.
 *
 * PRECISE MEANS PRECISE. These helpers touch ONE section each. Never
 * `invalidateQueries({ queryKey: ['courseled'] })` — that would refetch six
 * sections because one review was written, which is worse than the polling it
 * replaces.
 *
 * The section hooks import these keys so writers and readers cannot drift.
 */
import type { QueryClient } from '@tanstack/react-query';

/** Prefix of `['courseled', 'latest-reviews', pageSize]`. */
export const LATEST_REVIEWS_KEY = ['courseled', 'latest-reviews'] as const;

/** Prefix of `['courseled', 'moments', WINDOW_DAYS]`. */
export const MOMENTS_KEY = ['courseled', 'moments'] as const;

/**
 * Prefix of `['discover-prompt', <part>, userId]`.
 *
 * The prompt row ("one thing to do") is derived ENTIRELY from the member's own
 * writes: ratings that carry no category breakdown, and courses they have
 * already posted about. So it is the one section whose staleness is always the
 * member's own doing — at 5 minutes it can keep recommending a course they
 * rated a moment ago, which is the exact failure the row is meant to avoid.
 */
export const DISCOVER_PROMPT_KEY = ['discover-prompt'] as const;

/** A review was written or edited — Latest reviews only. */
export function invalidateDiscoverReviews(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: LATEST_REVIEWS_KEY });
}

/** A post with media was published — Moments of the week only. */
export function invalidateDiscoverMoments(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: MOMENTS_KEY });
}

/** The member rated a course, or posted about one — recompute the prompt. */
export function invalidateDiscoverPrompt(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: DISCOVER_PROMPT_KEY });
}
