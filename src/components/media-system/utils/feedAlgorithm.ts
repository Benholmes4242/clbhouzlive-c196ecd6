import type { FeedPost, FeedTab } from '../types/media';

/** Algorithm constants */
const REVIEW_INTERVAL_SUGGESTED = 5;
const REVIEW_INTERVAL_FRIENDS = 8;

/**
 * Interleave review posts into the feed at fixed intervals.
 */
export function interleaveReviews(
  posts: FeedPost[],
  tab: FeedTab
): FeedPost[] {
  const interval = tab === 'suggested'
    ? REVIEW_INTERVAL_SUGGESTED
    : REVIEW_INTERVAL_FRIENDS;

  const reviews: FeedPost[] = [];
  const regular: FeedPost[] = [];

  for (const post of posts) {
    if (post.isReview) {
      reviews.push(post);
    } else {
      regular.push(post);
    }
  }

  const result: FeedPost[] = [];
  let reviewIdx = 0;
  let regularIdx = 0;
  let position = 1;

  const totalTarget = posts.length;

  while (result.length < totalTarget && (regularIdx < regular.length || reviewIdx < reviews.length)) {
    if (position % interval === 0 && reviewIdx < reviews.length) {
      result.push(reviews[reviewIdx++]);
    } else if (regularIdx < regular.length) {
      result.push(regular[regularIdx++]);
    } else if (reviewIdx < reviews.length) {
      result.push(reviews[reviewIdx++]);
    }
    position++;
  }

  return result;
}

/**
 * Deduplicate posts by id, preserving order.
 */
export function deduplicatePosts(posts: FeedPost[]): FeedPost[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

/**
 * Inject live tournament cards into the feed and suppress completed cards
 * for the same tour slug.
 *
 * - Live cards go at position 0 (first thing seen)
 * - Completed tournament_result cards for live tour slugs are suppressed
 */
export function injectLiveTournamentCards(
  feedPosts: FeedPost[],
  livePosts: FeedPost[],
  liveTourSlugs: string[]
): FeedPost[] {
  if (!livePosts.length) return feedPosts;

  // Remove completed tournament_result cards for tours that are currently live
  const filtered = feedPosts.filter(post => {
    if (post.postType !== 'tournament_result') return true;
    const meta = (post as unknown as Record<string, unknown>).tournamentMeta as { tour_slug?: string } | undefined;
    if (!meta?.tour_slug) return true;
    return !liveTourSlugs.includes(meta.tour_slug);
  });

  // Deduplicate: don't inject if somehow already present
  const existingLiveIds = new Set(
    filtered.filter(p => p.postType === 'tournament_live').map(p => p.id)
  );
  const newLivePosts = livePosts.filter(p => !existingLiveIds.has(p.id));

  return [...newLivePosts, ...filtered];
}
