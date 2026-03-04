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
