import type { FeedPost, FeedTab } from '../types/media';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTED_REVIEW_POSITION = 7;
const SUGGESTED_TOURNAMENT_SLOT = 4;
const SUGGESTED_BLOCK_SIZE = 10;
const SUGGESTED_MIN_VIDEO_DURATION = 4;
const SUGGESTED_MAX_ASPECT_RATIO = 1.0; // anything above = landscape = excluded
const FRIENDS_REVIEW_POSITION = 9;
const FRIENDS_BLOCK_SIZE = 10;
const MAX_POSTS_PER_CREATOR = 4;
const MAX_REVIEWS_PER_CREATOR = 4;

// ── Type Guards ────────────────────────────────────────────────────────────────
function isTournamentPost(p: FeedPost): boolean {
  return p.postType === 'tournament_result' || p.postType === 'tournament_live';
}

function isReviewPost(p: FeedPost): boolean {
  return !!p.isReview;
}

// ── Suggested Feed Filter ──────────────────────────────────────────────────────
/**
 * Filter posts for the Suggested (For You) feed.
 * PORTRAIT VIDEO ONLY. Excludes landscape videos and sub-4-second clips.
 * Images pass if portrait or multi-image carousel.
 * Tournament/review posts pass regardless (injected separately).
 */
export function filterForSuggested(posts: FeedPost[]): FeedPost[] {
  return posts.filter(post => {
    // Tournament and review posts bypass media filters
    if (isTournamentPost(post) || isReviewPost(post)) return true;

    const media = post.mediaItems;
    if (!media || media.length === 0) return false;

    // Multi-image carousels: allow any aspect ratio
    const isCarousel = media.length > 1 && media.every(m => m.type === 'image');
    if (isCarousel) return true;

    const first = media[0];

    if (first.type === 'video') {
      // Exclude landscape videos
      const ar = (first.width && first.height) ? first.width / first.height : 0;
      if (ar > SUGGESTED_MAX_ASPECT_RATIO) return false;
      // Exclude sub-4-second clips
      if (first.duration !== undefined && first.duration < SUGGESTED_MIN_VIDEO_DURATION) return false;
      return true;
    }

    if (first.type === 'image') {
      // Portrait images only (height >= width)
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
    } else if (!isTournamentPost(post)) {
      const count = postCount.get(key) ?? 0;
      if (count >= MAX_POSTS_PER_CREATOR) return false;
      postCount.set(key, count + 1);
    }
    return true;
  });
}

// ── Review Interleave ──────────────────────────────────────────────────────────
/**
 * Interleave review posts at a fixed slot within each BLOCK_SIZE block.
 * Suggested: slot 7 of every 10. Friends: slot 9 of every 10.
 */
export function interleaveReviews(posts: FeedPost[], tab: FeedTab): FeedPost[] {
  const reviewSlot = tab === 'suggested' ? SUGGESTED_REVIEW_POSITION : FRIENDS_REVIEW_POSITION;
  const blockSize = tab === 'suggested' ? SUGGESTED_BLOCK_SIZE : FRIENDS_BLOCK_SIZE;

  const reviews: FeedPost[] = posts.filter(p => isReviewPost(p) && !isTournamentPost(p));
  const regular: FeedPost[] = posts.filter(p => !isReviewPost(p) && !isTournamentPost(p));

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

// ── Tournament Card Injection (Suggested only) ────────────────────────────────
/**
 * Inject live or completed tournament card into the suggested feed.
 * Rules:
 * 1. Maximum ONE tournament card per feed (live beats completed).
 * 2. Card appears at slot SUGGESTED_TOURNAMENT_SLOT (4) of the FIRST block only.
 * 3. If a live card is present, completed cards for the same tour are suppressed.
 * 4. If no slot 4 exists yet, append at end.
 * 5. Does NOT recur in subsequent blocks.
 */
export function injectLiveTournamentCards(
  feedPosts: FeedPost[],
  livePosts: FeedPost[],
  liveTourSlugs: string[]
): FeedPost[] {
  // Step 1: Suppress completed result cards for currently-live tours
  const filtered = feedPosts.filter(post => {
    if (post.postType !== 'tournament_result') return true;
    const meta = (post as any).tournamentMeta as { tour_slug?: string } | undefined;
    if (!meta?.tour_slug) return true;
    return !liveTourSlugs.includes(meta.tour_slug);
  });

  // Step 2: Pick the single best tournament card (live > completed, highest purse)
  const liveCard = livePosts.length > 0 ? livePosts[0] : null;
  const resultCards = filtered.filter(p => p.postType === 'tournament_result');
  const tournamentCard: FeedPost | null = liveCard ?? (resultCards.length > 0 ? resultCards[0] : null);
  if (!tournamentCard) return filtered;

  // Step 3: Build regular stream (exclude all tournament posts)
  const regular = filtered.filter(p => !isTournamentPost(p));

  // Step 4: Insert at slot 4 of block 1 only
  const SLOT = SUGGESTED_TOURNAMENT_SLOT - 1; // 0-indexed = 3
  const result: FeedPost[] = [];
  let injected = false;
  for (let i = 0; i < regular.length; i++) {
    if (i === SLOT && !injected) {
      result.push(tournamentCard);
      injected = true;
    }
    result.push(regular[i]);
  }
  // If feed has fewer than 4 posts, append at end
  if (!injected) result.push(tournamentCard);
  return deduplicatePosts(result);
}

// ── Full Suggested Feed Pipeline ──────────────────────────────────────────────
/**
 * Apply the complete suggested feed pipeline:
 * 1. Filter (portrait video only, min duration, portrait images)
 * 2. Interleave reviews at slot 7 of every 10-block
 * 3. Deduplicate
 * Tournament injection happens in Clubhouse.tsx (needs live data from hook).
 */
export function buildSuggestedFeed(posts: FeedPost[]): FeedPost[] {
  const noLive = posts.filter(p => p.postType !== 'tournament_live');
  const filtered = filterForSuggested(noLive);
  const capped = capPerCreator(filtered);
  const interleaved = interleaveReviews(capped, 'suggested');
  return deduplicatePosts(interleaved);
}

// ── Full Friends Feed Pipeline ────────────────────────────────────────────────
/**
 * Apply the complete friends feed pipeline:
 * 1. No media filter (all aspect ratios, all durations)
 * 2. Interleave reviews at slot 9 of every 10-block
 * 3. Deduplicate
 * No tournament injection in friends feed.
 */
export function buildFriendsFeed(posts: FeedPost[]): FeedPost[] {
  const noLive = posts.filter(p => p.postType !== 'tournament_live');
  const capped = capPerCreator(noLive);
  const interleaved = interleaveReviews(capped, 'friends');
  return deduplicatePosts(interleaved);
}
