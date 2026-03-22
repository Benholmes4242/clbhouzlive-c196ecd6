import type { FeedPost, FeedTab } from '../types/media';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTED_REVIEW_POSITION = 7;
const SUGGESTED_BLOCK_SIZE = 10;
const SUGGESTED_MIN_VIDEO_DURATION = 4;
const SUGGESTED_MAX_ASPECT_RATIO = 1.0; // anything above = landscape = excluded
const FRIENDS_REVIEW_POSITION = 9;
const FRIENDS_BLOCK_SIZE = 10;
const MAX_POSTS_PER_CREATOR = 4;
const MAX_REVIEWS_PER_CREATOR = 4;

// ── Type Guards ────────────────────────────────────────────────────────────────
function isReviewPost(p: FeedPost): boolean {
  return !!p.isReview;
}

// ── Suggested Feed Filter ──────────────────────────────────────────────────────
export function filterForSuggested(posts: FeedPost[]): FeedPost[] {
  return posts.filter(post => {
    // Review posts bypass media filters
    if (isReviewPost(post)) return true;

    const media = post.mediaItems;
    if (!media || media.length === 0) return false;

    // Multi-image carousels: allow any aspect ratio
    const isCarousel = media.length > 1 && media.every(m => m.type === 'image');
    if (isCarousel) return true;

    const first = media[0];

    if (first.type === 'video') {
      const ar = (first.width && first.height) ? first.width / first.height : 0;
      if (ar > SUGGESTED_MAX_ASPECT_RATIO) return false;
      if (first.duration !== undefined && first.duration < SUGGESTED_MIN_VIDEO_DURATION) return false;
      return true;
    }

    if (first.type === 'image') {
      if (first.width && first.height && first.width > first.height) return false;
      return true;
    }

    return false;
  });
}

// ── Deduplication ──────────────────────────────────────────────────────────────
export function deduplicatePosts(posts: FeedPost[]): FeedPost[] {
  const seen = new Set<string>();
  return posts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ── Per-Creator Cap ───────────────────────────────────────────────────────────
export function capPerCreator(posts: FeedPost[]): FeedPost[] {
  const postCount = new Map<string, number>();
  const reviewCount = new Map<string, number>();
  return posts.filter(post => {
    const key = post.userId;
    if (isReviewPost(post)) {
      const count = reviewCount.get(key) ?? 0;
      if (count >= MAX_REVIEWS_PER_CREATOR) return false;
      reviewCount.set(key, count + 1);
    } else {
      const count = postCount.get(key) ?? 0;
      if (count >= MAX_POSTS_PER_CREATOR) return false;
      postCount.set(key, count + 1);
    }
    return true;
  });
}

// ── Review Interleave ──────────────────────────────────────────────────────────
export function interleaveReviews(posts: FeedPost[], tab: FeedTab): FeedPost[] {
  const reviewSlot = tab === 'suggested' ? SUGGESTED_REVIEW_POSITION : FRIENDS_REVIEW_POSITION;
  const blockSize = tab === 'suggested' ? SUGGESTED_BLOCK_SIZE : FRIENDS_BLOCK_SIZE;

  const reviews: FeedPost[] = posts.filter(p => isReviewPost(p));
  const regular: FeedPost[] = posts.filter(p => !isReviewPost(p));

  const result: FeedPost[] = [];
  let regularIdx = 0, reviewIdx = 0, slotInBlock = 1;

  while (regularIdx < regular.length || reviewIdx < reviews.length) {
    if (slotInBlock === reviewSlot && reviewIdx < reviews.length) {
      result.push(reviews[reviewIdx++]);
    } else if (regularIdx < regular.length) {
      result.push(regular[regularIdx++]);
    } else if (reviewIdx < reviews.length) {
      result.push(reviews[reviewIdx++]);
    } else break;
    slotInBlock = slotInBlock < blockSize ? slotInBlock + 1 : 1;
  }
  return result;
}

/**
 * Inject the TournamentHubCard at slot 4 of the suggested feed.
 * One card only, always at slot 4, never repeats.
 */
export function injectTournamentHubCard(
  feedPosts: FeedPost[],
  hubPost: FeedPost | null
): FeedPost[] {
  if (!hubPost) return feedPosts;
  const SLOT = 3; // slot 4, 0-indexed
  const result: FeedPost[] = [];
  let injected = false;
  for (let i = 0; i < feedPosts.length; i++) {
    if (i === SLOT && !injected) { result.push(hubPost); injected = true; }
    result.push(feedPosts[i]);
  }
  if (!injected) result.push(hubPost);
  return deduplicatePosts(result);
}

// ── Full Suggested Feed Pipeline ──────────────────────────────────────────────
export function buildSuggestedFeed(posts: FeedPost[]): FeedPost[] {
  const noHub = posts.filter(p => p.postType !== 'tournament_hub');
  const filtered = filterForSuggested(noHub);
  const capped = capPerCreator(filtered);
  const interleaved = interleaveReviews(capped, 'suggested');
  return deduplicatePosts(interleaved);
}

// ── Full Friends Feed Pipeline ────────────────────────────────────────────────
export function buildFriendsFeed(posts: FeedPost[]): FeedPost[] {
  const noHub = posts.filter(p => p.postType !== 'tournament_hub');
  const capped = capPerCreator(noHub);
  const interleaved = interleaveReviews(capped, 'friends');
  return deduplicatePosts(interleaved);
}
