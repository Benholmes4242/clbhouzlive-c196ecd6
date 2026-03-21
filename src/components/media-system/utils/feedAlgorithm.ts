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

  // Step 1 — suppress completed result cards for tours that are currently live
  const filtered = feedPosts.filter(post => {
    if (post.postType !== 'tournament_result') return true;
    const meta = (post as unknown as Record<string, any>).tournamentMeta as { tour_slug?: string } | undefined;
    if (!meta?.tour_slug) return true;
    return !liveTourSlugs.includes(meta.tour_slug);
  });

  // Step 2 — don't re-inject if already present
  const existingLiveIds = new Set(
    filtered.filter(p => p.postType === 'tournament_live').map(p => p.id)
  );
  const newLivePosts = livePosts.filter(p => !existingLiveIds.has(p.id));

  if (!newLivePosts.length) return filtered;

  // Step 3 — build regular and tournament arrays from filtered posts
  const BLOCK_SIZE        = 10;
  const SLOT_WITHIN_BLOCK = 4;

  const regular: FeedPost[]    = [];
  const tournament: FeedPost[] = [];

  for (const post of filtered) {
    if (post.postType === 'tournament_result' || post.postType === 'tournament_live') {
      tournament.push(post);
    } else {
      regular.push(post);
    }
  }

  // Merge new live posts and existing tournament posts into one array,
  // then sort the whole thing by priority so PGA always beats LIV
  // regardless of which render cycle each card was first seen in.
  tournament.push(...newLivePosts);
  tournament.sort((a, b) => {
    const aPriority = (a as any).liveMeta?.tourPriority
      ?? (a as any).tournamentMeta?.tour_priority
      ?? 99;
    const bPriority = (b as any).liveMeta?.tourPriority
      ?? (b as any).tournamentMeta?.tour_priority
      ?? 99;
    return aPriority - bPriority;
  });

  // Cap to a single tournament card
  const cappedTournament = tournament.slice(0, 1);

  const result: FeedPost[] = [];
  let regularIdx    = 0;
  let tournamentIdx = 0;

  while (regularIdx < regular.length || tournamentIdx < cappedTournament.length) {
    for (let slot = 1; slot <= BLOCK_SIZE; slot++) {
      if (slot === SLOT_WITHIN_BLOCK && tournamentIdx < cappedTournament.length) {
        result.push(cappedTournament[tournamentIdx++]);
      } else if (regularIdx < regular.length) {
        result.push(regular[regularIdx++]);
      }
      if (regularIdx >= regular.length && tournamentIdx >= cappedTournament.length) break;
    }
  }

  return deduplicatePosts(result);
}
