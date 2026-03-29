import type { FeedPost, FeedTab } from '../types/media';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTED_REVIEW_POSITION = 4;
const SUGGESTED_TOURNAMENT_SLOT = 4;
const SUGGESTED_BLOCK_SIZE = 6;
const SUGGESTED_MIN_VIDEO_DURATION = 4;
const SUGGESTED_MAX_ASPECT_RATIO = 1.0; // anything above = landscape = excluded
const FRIENDS_REVIEW_POSITION = 9;
const FRIENDS_BLOCK_SIZE = 10;
const MAX_POSTS_PER_CREATOR = 4;
const MAX_REVIEWS_PER_CREATOR = 4;

// ── Type Guards ────────────────────────────────────────────────────────────────
function isTournamentPost(p: FeedPost): boolean {
  return p.postType === 'tournament_live';
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


// ── Video/Image Weighting ─────────────────────────────────────────────────────
const SUGGESTED_VIDEO_RATIO = 0.8; // 80% of regular (non-review) slots should be video

/**
 * Weight the filtered post array toward video content.
 * Distributes videos and images in the configured ratio
 * while preserving relative chronological order within each type.
 * Review posts are untouched — they are handled by interleaveReviews separately.
 */
export function weightByMediaType(posts: FeedPost[]): FeedPost[] {
  const reviews = posts.filter(p => isReviewPost(p));
  const videos = posts.filter(p => !isReviewPost(p) && p.mediaItems.some(m => m.type === 'video'));
  const images = posts.filter(p => !isReviewPost(p) && !p.mediaItems.some(m => m.type === 'video'));

  const regularCount = videos.length + images.length;
  if (regularCount === 0) return posts;

  // Calculate target counts based on ratio
  const targetVideoCount = Math.round(regularCount * SUGGESTED_VIDEO_RATIO);
  const targetImageCount = regularCount - targetVideoCount;

  // Take up to the target count from each bucket (already sorted newest-first)
  const selectedVideos = videos.slice(0, targetVideoCount);
  const selectedImages = images.slice(0, targetImageCount);

  // If one bucket runs short, backfill from the other
  const videoShortfall = targetVideoCount - selectedVideos.length;
  const imageShortfall = targetImageCount - selectedImages.length;

  const backfilledVideos = videoShortfall > 0
    ? [...selectedVideos, ...images.slice(targetImageCount, targetImageCount + videoShortfall)]
    : selectedVideos;

  const backfilledImages = imageShortfall > 0
    ? [...selectedImages, ...videos.slice(targetVideoCount, targetVideoCount + imageShortfall)]
    : selectedImages;

  // Interleave videos and images to distribute them evenly rather than all videos first
  const regular: FeedPost[] = [];
  let vi = 0, ii = 0;
  const videoWeight = SUGGESTED_VIDEO_RATIO;

  while (vi < backfilledVideos.length || ii < backfilledImages.length) {
    // Determine whether next slot should be video or image based on ratio
    const videosDue = vi / (backfilledVideos.length || 1) <= videoWeight || ii >= backfilledImages.length;
    if (videosDue && vi < backfilledVideos.length) {
      regular.push(backfilledVideos[vi++]);
    } else if (ii < backfilledImages.length) {
      regular.push(backfilledImages[ii++]);
    } else {
      regular.push(backfilledVideos[vi++]);
    }
  }

  // Return only weighted non-reviews. Reviews are excluded here because
  // interleaveReviews (which runs next) separates reviews from the input
  // and re-injects them at fixed slots. If we appended reviews at the end,
  // they'd be stripped out and re-injected anyway — but bunching them at
  // the tail could cause position drift if the array is truncated.
  return regular;
}

// ── Full Suggested Feed Pipeline ──────────────────────────────────────────────
/**
 * Apply the complete suggested feed pipeline:
 * 1. Filter (portrait video only, min duration, portrait images)
 * 2. Cap per creator
 * 3. Weight toward 80% video / 20% image
 * 4. Interleave reviews at slot 4 of every 6-block
 * 5. Deduplicate
 * Tournament injection happens in Clubhouse.tsx (needs live data from hook).
 */
export function buildSuggestedFeed(posts: FeedPost[]): FeedPost[] {
  const noLive = posts.filter(p => p.postType !== 'tournament_live');
  const filtered = filterForSuggested(noLive);
  const capped = capPerCreator(filtered);

  // weightByMediaType only returns non-review posts (weighted 80/20 video/image).
  // We must re-add review posts so interleaveReviews can inject them at fixed slots.
  const reviews = capped.filter(p => isReviewPost(p));
  const weighted = [...weightByMediaType(capped), ...reviews];

  const interleaved = interleaveReviews(weighted, 'suggested');
  const deduped = deduplicatePosts(interleaved);

  console.log('[FeedAlgorithm] Final order:', deduped.map((p, i) =>
    `${i + 1}:${p.isReview ? 'REVIEW' : p.mediaItems[0]?.type === 'video' ? 'video' : 'image'}`
  ).join(', '));

  return deduped;
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

/**
 * Inject PGA card at slot 3 (0-indexed position 2) of the suggested feed.
 * If pgaCard is null, feed is returned unchanged.
 */
export function injectPGACard(feedPosts: FeedPost[], pgaCard: FeedPost | null): FeedPost[] {
  if (!pgaCard) return feedPosts;
  const without = feedPosts.filter(p => (p as any).postType !== 'pga_card');
  const result = [...without];
  result.splice(Math.min(5, result.length), 0, pgaCard);
  return result;
}

// ── Editorial Card Injection ──────────────────────────────────────────────────

export function injectHistoryCard(
  feedPosts: FeedPost[],
  card: FeedPost | null
): FeedPost[] {
  if (!card) return feedPosts;
  const without = feedPosts.filter(p => (p as any).postType !== 'history_card');
  const result = [...without];
  result.splice(Math.min(9, result.length), 0, card);
  return result;
}

export function injectCourseOfWeekCard(
  feedPosts: FeedPost[],
  card: FeedPost | null
): FeedPost[] {
  if (!card) return feedPosts;
  const without = feedPosts.filter(p => (p as any).postType !== 'course_of_week_card');
  const result = [...without];
  result.splice(Math.min(1, result.length), 0, card);
  return result;
}

export function injectDebateCard(
  feedPosts: FeedPost[],
  card: FeedPost | null
): FeedPost[] {
  if (!card) return feedPosts;
  const without = feedPosts.filter(p => (p as any).postType !== 'debate_card');
  const result = [...without];
  result.splice(Math.min(13, result.length), 0, card);
  return result;
}
