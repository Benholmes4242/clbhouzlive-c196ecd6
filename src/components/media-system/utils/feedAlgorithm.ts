import type { FeedPost, FeedTab } from '../types/media';

// ── Orbit Feed Algorithm v1.0 ─────────────────────────────────────────────────
// Scoring model: engagement gravity × relationship amplifier × time decay × session entropy
// Posts compete for positions. Editorial cards are scored, not fixed-injected.
// Every session produces a unique feed. High quality always rises — but never identically.

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTED_MIN_VIDEO_DURATION = 4;
const SUGGESTED_MAX_ASPECT_RATIO = 1.0;
const MAX_POSTS_PER_CREATOR = 4;
const MAX_REVIEWS_PER_CREATOR = 4;
const DECAY_LAMBDA = 0.035;          // half-life ~20 days matching RPC curve
const ENTROPY_FLOOR = 0.82;          // minimum score multiplier from jitter
const ENTROPY_RANGE = 0.32;          // jitter range on top of floor (max 1.14x)
const EDITORIAL_BASE_SCORE = 180;    // editorial cards compete as if ~40 likes + 15 comments
const REVIEW_POST_BONUS = 1.4;       // golf-native boost for course reviews
const MIN_EDITORIAL_GAP = 5;         // minimum posts between any two editorial cards
const VIDEO_TARGET_RATIO = 0.80;

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
  return ['pga_card', 'history_card', 'course_of_week_card', 'debate_card',
          'review_of_week_card', 'tournament_live'].includes(p.postType ?? '');
}

function isReviewPost(p: FeedPost): boolean {
  return !!p.isReview;
}

// ── Suggested Feed Filter ─────────────────────────────────────────────────────
export function filterForSuggested(posts: FeedPost[]): FeedPost[] {
  return posts.filter(post => {
    if (isEditorialCard(post) || isReviewPost(post)) return true;
    const media = post.mediaItems;
    if (!media || media.length === 0) return false;
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
  const shares = post.shareCount ?? 0;

  // Layer 1: engagement gravity
  const engagement = likes * 3 + comments * 5 + shares * 4;

  // Layer 2: relationship amplifier
  const relation = post.creatorRelation ?? 'none';
  const relationMultiplier =
    relation === 'friend' ? 2.5 :
    relation === 'following' ? 1.8 : 1.0;

  // Layer 3: time decay — exponential, half-life ~9 days
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const decayMultiplier = Math.exp(-DECAY_LAMBDA * ageDays);

  // Layer 4: golf-native review bonus
  const reviewMultiplier = isReviewPost(post) ? REVIEW_POST_BONUS : 1.0;

  // Base score — minimum of 1 so brand new posts with zero engagement still appear
  const baseScore = Math.max(1, engagement * relationMultiplier * decayMultiplier * reviewMultiplier);

  // Layer 5: session entropy — ±16% jitter, deterministic within session hour
  const jitter = ENTROPY_FLOOR + seededRandom(post.id) * ENTROPY_RANGE;

  return baseScore * jitter;
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

// ── Video/Image Balance Pass ──────────────────────────────────────────────────
function balanceMediaTypes(posts: FeedPost[]): FeedPost[] {
  // Separate editorials — keep their scored positions, rebuild around them
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
  const videos = nonEditorials.filter(p =>
    !isReviewPost(p) && p.mediaItems.some(m => m.type === 'video'));
  const images = nonEditorials.filter(p =>
    !isReviewPost(p) && !p.mediaItems.some(m => m.type === 'video'));

  const regularCount = videos.length + images.length;
  if (regularCount === 0) return posts;

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

  // Interleave at 80/20 ratio
  const regular: FeedPost[] = [];
  let vi = 0, ii = 0;
  while (vi < finalVideos.length || ii < finalImages.length) {
    const videosDue = (vi / (finalVideos.length || 1)) <= VIDEO_TARGET_RATIO || ii >= finalImages.length;
    if (videosDue && vi < finalVideos.length) regular.push(finalVideos[vi++]);
    else if (ii < finalImages.length) regular.push(finalImages[ii++]);
    else regular.push(finalVideos[vi++]);
  }

  // Interleave reviews every 6 regular posts
  const merged: FeedPost[] = [];
  let ri = 0, regi = 0, slot = 1;
  while (regi < regular.length || ri < reviews.length) {
    if (slot === 4 && ri < reviews.length) merged.push(reviews[ri++]);
    else if (regi < regular.length) merged.push(regular[regi++]);
    else if (ri < reviews.length) merged.push(reviews[ri++]);
    else break;
    slot = slot < 6 ? slot + 1 : 1;
  }

  // Re-insert editorials at their proportional scored positions
  const totalScored = posts.length;
  const result = [...merged];
  let insertOffset = 0;

  for (const { idx, post } of editorialPositions) {
    const proportion = totalScored > 0 ? idx / totalScored : 0;
    const insertAt = Math.min(
      Math.round(proportion * result.length) + insertOffset,
      result.length
    );
    result.splice(insertAt, 0, post);
    insertOffset++;
  }

  return result;
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
  postType: string
): FeedPost[] {
  if (!card) return feedPosts;
  const alreadyPresent = feedPosts.some(p => (p as any).postType === postType);
  if (alreadyPresent) return feedPosts;
  const insertAt = Math.min(4, feedPosts.length);
  const result = [...feedPosts];
  result.splice(insertAt, 0, card);
  return result;
}

export function injectPGACard(feedPosts: FeedPost[], pgaCard: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, pgaCard, 'pga_card');
}

export function injectHistoryCard(feedPosts: FeedPost[], card: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, card, 'history_card');
}

export function injectCourseOfWeekCard(feedPosts: FeedPost[], card: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, card, 'course_of_week_card');
}

export function injectDebateCard(feedPosts: FeedPost[], card: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, card, 'debate_card');
}

export function injectReviewOfWeekCard(feedPosts: FeedPost[], card: FeedPost | null): FeedPost[] {
  return ensureEditorialCard(feedPosts, card, 'review_of_week_card');
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
