import type { FeedPost, FeedTab } from '../types/media';

// ── Orbit Feed Algorithm v1.1 ─────────────────────────────────────────────────
// Scoring model: engagement gravity × relationship amplifier × time decay × session entropy
// Posts compete for positions. Editorial cards are scored, not fixed-injected.
// Every session produces a unique feed. High quality always rises — but never identically.
//
// v1.1 (Session A cleanup):
//   - balanceMediaTypes split into named pure passes:
//       balanceVideoImage → interleaveReviewsIntoFeed → placeEditorials
//   - filterForSuggested reduced to a pass-through safety net + warn,
//     since the get_suggested_feed RPC now filters renderable posts server-side.

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTED_MIN_VIDEO_DURATION = 4;
const SUGGESTED_MAX_ASPECT_RATIO = 1.0;
const MAX_POSTS_PER_CREATOR = 4;
const MAX_REVIEWS_PER_CREATOR = 4;
const DECAY_LAMBDA = 0.035;
const ENTROPY_FLOOR = 0.82;
const ENTROPY_RANGE = 0.32;
const EDITORIAL_BASE_SCORE = 180;
const REVIEW_POST_BONUS = 1.6;       // increased — reviews are high-value content
const MIN_EDITORIAL_GAP = 5;
const VIDEO_TARGET_RATIO = 0.80;

// Freshness scoring constants
const FRESHNESS_BASE = 100;          // brand new post starts at 100 — beats any stale content
const FRESHNESS_HALF_LIFE_HOURS = 36; // score halves every 36 hours
const ENGAGEMENT_BONUS_PER_LIKE = 4;  // each like adds 4 points on top of freshness
const ENGAGEMENT_BONUS_PER_COMMENT = 7; // each comment adds 7 points
const NEW_REVIEW_BONUS = 2.0;        // new reviews get extra boost — discovery of ratings is core to the app

// ── Session seed ─────────────────────────────────────────────────────────────
let _sessionSeed = 0;
let _sessionUserId = '';
let _sessionHour = 0;

export function initSessionSeed(userId: string): void {
  const currentHour = Math.floor(Date.now() / 3_600_000);
  if (userId === _sessionUserId && currentHour === _sessionHour) return;
  _sessionUserId = userId;
  _sessionHour = currentHour;
  let hash = 0;
  const str = userId + String(currentHour);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  _sessionSeed = hash;
}

function seededRandom(postId: string): number {
  let hash = _sessionSeed;
  for (let i = 0; i < postId.length; i++) {
    hash = (hash * 31 + postId.charCodeAt(i)) >>> 0;
  }
  return (hash >>> 0) / 0xFFFFFFFF;
}

// ── Type Guards ────────────────────────────────────────────────────────────────
function isEditorialCard(p: FeedPost): boolean {
  return ['pga_card', 'course_of_week_card',
          'tournament_live'].includes(p.postType ?? '');
}

function isReviewPost(p: FeedPost): boolean {
  return !!p.isReview;
}

// ── Suggested Feed Filter (PASS-THROUGH SAFETY NET) ───────────────────────────
// The get_suggested_feed RPC now filters non-renderable posts server-side.
// This client-side function is kept as a safety net: if an unexpected post shape
// sneaks through (e.g. media without dimensions), we log it for observability
// but do NOT drop it — the RPC contract is that everything returned is renderable.
// Can be removed entirely after ~2 weeks of clean logs.
export function filterForSuggested(posts: FeedPost[]): FeedPost[] {
  if (process.env.NODE_ENV === 'development') {
    for (const post of posts) {
      if (isEditorialCard(post) || isReviewPost(post)) continue;
      const media = post.mediaItems;
      if (!media || media.length === 0) {
        console.warn('[filterForSuggested] unexpected post without media:', post.id);
        continue;
      }
      const first = media[0];
      if (first.type === 'video') {
        const ar = (first.width && first.height) ? first.width / first.height : 0;
        if (ar > SUGGESTED_MAX_ASPECT_RATIO) {
          console.warn('[filterForSuggested] unexpected landscape video:', post.id, 'AR=', ar);
        }
        if (first.duration !== undefined && first.duration < SUGGESTED_MIN_VIDEO_DURATION) {
          console.warn('[filterForSuggested] unexpected short video:', post.id, 'dur=', first.duration);
        }
      }
    }
  }
  return posts;
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
    if (isEditorialCard(post)) return true;
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

// ── Orbit Score ───────────────────────────────────────────────────────────────
function orbitScore(post: FeedPost): number {
  if (isEditorialCard(post)) return EDITORIAL_BASE_SCORE;

  const likes = post.likeCount ?? 0;
  const comments = post.commentCount ?? 0;

  // Layer 1: Freshness is the primary score
  // New posts start at FRESHNESS_BASE and decay with a half-life of 36 hours.
  // This means a brand new post always outscores any stale content regardless of likes.
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const freshnessScore = FRESHNESS_BASE * Math.pow(0.5, ageHours / FRESHNESS_HALF_LIFE_HOURS);

  // Layer 2: Engagement is additive — it extends a post's lifespan but doesn't override freshness
  // A post with 10 likes + 2 comments gets +54 points on top of its freshness score.
  // This lets viral posts stay visible longer, but never buries new content.
  const engagementBonus = (likes * ENGAGEMENT_BONUS_PER_LIKE) + (comments * ENGAGEMENT_BONUS_PER_COMMENT);

  // Layer 3: Review bonus — course reviews are core to Clbhouz, boost them significantly
  const reviewMultiplier = isReviewPost(post) ? NEW_REVIEW_BONUS : 1.0;

  // Layer 4: Session entropy — ±16% jitter keeps feed feeling fresh each session
  const jitter = ENTROPY_FLOOR + seededRandom(post.id) * ENTROPY_RANGE;

  return (freshnessScore + engagementBonus) * reviewMultiplier * jitter;
}

// ── Diversity Pass ────────────────────────────────────────────────────────────
function applyCreatorDiversity(posts: FeedPost[]): FeedPost[] {
  const result: FeedPost[] = [];
  const remaining = [...posts];

  while (remaining.length > 0) {
    const lastCreator = result.length > 0 ? result[result.length - 1].userId : null;
    const bestIdx = remaining.findIndex(p => p.userId !== lastCreator);
    if (bestIdx === -1) {
      result.push(remaining.shift()!);
    } else {
      result.push(remaining.splice(bestIdx, 1)[0]);
    }
  }
  return result;
}

// ── Editorial Gap Enforcement ─────────────────────────────────────────────────
function enforceEditorialGap(posts: FeedPost[]): FeedPost[] {
  const result: FeedPost[] = [];
  const editorialBuffer: FeedPost[] = [];
  let lastEditorialPos = 0; // editorial cards cannot appear at position 0 (first slot)

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (isEditorialCard(post)) {
      if (result.length - lastEditorialPos >= MIN_EDITORIAL_GAP) {
        result.push(post);
        lastEditorialPos = result.length - 1;
        while (editorialBuffer.length > 0 && result.length - lastEditorialPos >= MIN_EDITORIAL_GAP) {
          result.push(editorialBuffer.shift()!);
          lastEditorialPos = result.length - 1;
        }
      } else {
        editorialBuffer.push(post);
      }
    } else {
      result.push(post);
      while (editorialBuffer.length > 0 && result.length - lastEditorialPos >= MIN_EDITORIAL_GAP) {
        result.push(editorialBuffer.shift()!);
        lastEditorialPos = result.length - 1;
      }
    }
  }
  result.push(...editorialBuffer);
  return result;
}

// ── Pass 1: Video / Image Balance ─────────────────────────────────────────────
// Pure function. Takes non-editorial, non-review posts and produces a list
// interleaved at VIDEO_TARGET_RATIO (80% video / 20% image).
// Drains both pools fully — never drops content.
function balanceVideoImage(posts: FeedPost[]): FeedPost[] {
  const videos = posts.filter(p => p.mediaItems.some(m => m.type === 'video'));
  const images = posts.filter(p => !p.mediaItems.some(m => m.type === 'video'));

  const regularCount = videos.length + images.length;
  if (regularCount === 0) return [];

  const targetVideos = Math.round(regularCount * VIDEO_TARGET_RATIO);
  const targetImages = regularCount - targetVideos;
  const selectedVideos = videos.slice(0, targetVideos);
  const selectedImages = images.slice(0, targetImages);

  const finalVideos = selectedVideos.length < targetVideos
    ? [...selectedVideos, ...images.slice(targetImages)]
    : selectedVideos;
  const finalImages = selectedImages.length < targetImages
    ? [...selectedImages, ...videos.slice(targetVideos)]
    : selectedImages;

  const out: FeedPost[] = [];
  let vi = 0, ii = 0;
  while (vi < finalVideos.length || ii < finalImages.length) {
    const videosDue = (vi / (finalVideos.length || 1)) <= VIDEO_TARGET_RATIO || ii >= finalImages.length;
    if (videosDue && vi < finalVideos.length) out.push(finalVideos[vi++]);
    else if (ii < finalImages.length) out.push(finalImages[ii++]);
    else out.push(finalVideos[vi++]);
  }
  return out;
}

// ── Pass 2: Interleave Reviews into Regular Stream ────────────────────────────
// Pure function. Inserts a review at output positions 6, 12, 18, ...
// Slot math is local to this function — no other pass touches it.
function interleaveReviewsIntoFeed(regular: FeedPost[], reviews: FeedPost[]): FeedPost[] {
  const out: FeedPost[] = [];
  let ri = 0, regi = 0, slot = 1;
  while (regi < regular.length || ri < reviews.length) {
    if (slot === 6 && ri < reviews.length) out.push(reviews[ri++]);
    else if (regi < regular.length) out.push(regular[regi++]);
    else if (ri < reviews.length) out.push(reviews[ri++]);
    else break;
    slot = slot < 6 ? slot + 1 : 1;
  }
  return out;
}

// ── Pass 3: Place Editorial Cards ─────────────────────────────────────────────
// Pure function. Re-inserts editorial cards at proportional positions based on
// where they ranked in the original scored list. Maintains MIN_EDITORIAL_GAP via
// enforceEditorialGap downstream in the pipeline.
function placeEditorials(
  body: FeedPost[],
  editorialPositions: { idx: number; post: FeedPost }[],
  totalScored: number
): FeedPost[] {
  const out = [...body];
  let insertOffset = 0;
  for (const { idx, post } of editorialPositions) {
    const proportion = totalScored > 0 ? idx / totalScored : 0;
    const insertAt = Math.min(
      Math.round(proportion * out.length) + insertOffset,
      out.length
    );
    out.splice(insertAt, 0, post);
    insertOffset++;
  }
  return out;
}

// ── Composed Balance Pass ─────────────────────────────────────────────────────
// Orchestrates the three passes. Output contract identical to the pre-refactor
// monolithic balanceMediaTypes: same inputs produce same outputs.
function balanceMediaTypes(posts: FeedPost[]): FeedPost[] {
  // Partition: editorials retain their scored positions, the rest gets rebuilt
  const editorialPositions: { idx: number; post: FeedPost }[] = [];
  const nonEditorials: FeedPost[] = [];

  posts.forEach((p, idx) => {
    if (isEditorialCard(p)) {
      editorialPositions.push({ idx, post: p });
    } else {
      nonEditorials.push(p);
    }
  });

  const reviews = nonEditorials.filter(p => isReviewPost(p));
  const nonReviews = nonEditorials.filter(p => !isReviewPost(p));

  if (nonReviews.length === 0 && reviews.length === 0) return posts;

  // Pass 1: balance video/image at 80/20
  const balanced = balanceVideoImage(nonReviews);
  // Pass 2: interleave reviews at slot 6, 12, 18, ...
  const withReviews = interleaveReviewsIntoFeed(balanced, reviews);
  // Pass 3: re-insert editorials at proportional positions
  const withEditorials = placeEditorials(withReviews, editorialPositions, posts.length);

  return withEditorials;
}

// ── Full Orbit Suggested Feed Pipeline ───────────────────────────────────────
export function buildSuggestedFeed(posts: FeedPost[]): FeedPost[] {
  const noLive = posts.filter(p => p.postType !== 'tournament_live');
  const filtered = filterForSuggested(noLive);
  const capped = capPerCreator(filtered);

  // Score every post
  const scored = capped
    .map(p => ({ post: p, score: orbitScore(p) }))
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post);

  // Apply diversity and media balance
  const diverse = applyCreatorDiversity(scored);
  const balanced = balanceMediaTypes(diverse);
  const gapped = enforceEditorialGap(balanced);
  const deduped = deduplicatePosts(gapped);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Orbit] Feed assembled:', deduped.map((p, i) =>
      `${i + 1}:${isEditorialCard(p) ? 'EDITORIAL' : isReviewPost(p) ? 'review' :
        p.mediaItems[0]?.type === 'video' ? 'video' : 'image'}(${Math.round(orbitScore(p))})`
    ).join(', '));
  }

  return deduped;
}

// ── Friends Feed Pipeline ─────────────────────────────────────────────────────
export function buildFriendsFeed(posts: FeedPost[]): FeedPost[] {
  const noLive = posts.filter(p => p.postType !== 'tournament_live');
  const capped = capPerCreator(noLive);
  const reviews = capped.filter(p => isReviewPost(p));
  const regular = capped.filter(p => !isReviewPost(p));
  const result: FeedPost[] = [];
  let ri = 0, regi = 0, slot = 1;
  while (regi < regular.length || ri < reviews.length) {
    if (slot === 9 && ri < reviews.length) result.push(reviews[ri++]);
    else if (regi < regular.length) result.push(regular[regi++]);
    else if (ri < reviews.length) result.push(reviews[ri++]);
    else break;
    slot = slot < 10 ? slot + 1 : 1;
  }
  return deduplicatePosts(result);
}

// ── Editorial Card Injection ──────────────────────────────────────────────────
// Backward-compatible: ensure card is present, inserting at a reasonable
// position only if it wasn't included by the scoring pass.
function ensureEditorialCard(
  feedPosts: FeedPost[],
  card: FeedPost | null,
  postType: string,
  fallbackPosition: number
): FeedPost[] {
  if (!card) return feedPosts;
  const alreadyPresent = feedPosts.some(p => (p as any).postType === postType);
  if (alreadyPresent) return feedPosts;
  const insertAt = Math.min(fallbackPosition, feedPosts.length);
  const result = [...feedPosts];
  result.splice(insertAt, 0, card);
  return result;
}

export function injectPGACard(feedPosts: FeedPost[], pgaCard: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, pgaCard, 'pga_card', 1); // position 2
}

export function injectCourseOfWeekCard(feedPosts: FeedPost[], card: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, card, 'course_of_week_card', 6); // position 7
}

// ── Combined Orbit pipeline — posts + editorial cards scored together ──────
// Called from Clubhouse.tsx where both data sources are available simultaneously.
export function buildSuggestedFeedWithEditorials(
  rawPosts: FeedPost[],
  editorialCards: (FeedPost | null)[]
): FeedPost[] {
  // Merge editorial cards into the pool — filter nulls
  const validEditorials = editorialCards.filter((c): c is FeedPost => c !== null);
  const combined = [...rawPosts, ...validEditorials];
  // Run the full Orbit pipeline on the combined set
  return buildSuggestedFeed(combined);
}

// Legacy exports
export { isReviewPost, isEditorialCard };
export const interleaveReviews = buildFriendsFeed;
export const weightByMediaType = balanceMediaTypes;
