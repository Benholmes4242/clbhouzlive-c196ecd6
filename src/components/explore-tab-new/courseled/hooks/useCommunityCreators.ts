import { useMemo } from 'react';

import type { Moment } from './useMomentsOfTheWeek';

/**
 * COMMUNITY CREATORS (BRIEF_COMMUNITY_CREATOR_CARDS §5) — NO NEW QUERY.
 *
 * The moments the section already loads carry their author (post.userId,
 * displayName, avatarUrl), so eligibility, the counts and the frame are all
 * derived CLIENT-SIDE from the candidate pool already in hand. A creator's card
 * can therefore only ever show media the section could already have shown.
 *
 * ORDER IS RELEVANCE, NOT VOLUME (§3): friends first, then members posting at
 * courses this member has played, then item count as the tiebreak. Same
 * ordering the /community rails use, so the two surfaces agree — and a raw
 * "most posted" leaderboard stays closed.
 *
 * The viewing member is excluded: a card telling you about yourself is odd.
 */

/**
 * ELIGIBILITY FLOOR. A creator with a single item is not a creator; two is the
 * lowest number that reads as a body of work over 30 days. One constant so Ben
 * can move it.
 */
export const CREATOR_ITEM_FLOOR = 2;

/** Cards rendered in the section. Two, at different depths (§2). */
export const CREATOR_CARD_COUNT = 2;

export interface CommunityCreator {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Counted over the SAME 30-day window the section uses. */
  clips: number;
  photos: number;
  /** Their own most relevant recent item — the card's frame. */
  frame: Moment;
  /** Every moment of theirs in the pool, rank order — seeds the viewer. */
  moments: Moment[];
  /** Relevance rank inputs, for reporting. */
  isFriend: boolean;
  playedOverlap: boolean;
}

interface Args {
  /** The 30-day candidate pool already loaded by the section. */
  pool: Moment[];
  /** The viewing member; excluded from the result. */
  viewerId?: string | null;
  /** Accepted friendships (existing cached set — no new query). */
  friendIds?: Set<string>;
  /** Course ids the member has played (existing stats context). */
  playedCourseIds?: Set<string>;
}

export function buildCommunityCreators({
  pool,
  viewerId,
  friendIds,
  playedCourseIds,
}: Args): CommunityCreator[] {
  const byAuthor = new Map<string, Moment[]>();
  for (const m of pool) {
    const uid = m.post.userId;
    if (!uid || uid === viewerId) continue;
    // THE CAPTION IS A PERSON, so an unresolved identity cannot carry a card:
    // the hook falls back to "Player" when no profile row came back, and a card
    // captioned "Player" says less than the course tile beside it. Business
    // actors are excluded for the same reason — a card about a person.
    if (m.post.actorType && m.post.actorType !== 'personal') continue;
    if (!m.post.username) continue;
    const list = byAuthor.get(uid);
    if (list) list.push(m);
    else byAuthor.set(uid, [m]);
  }

  const creators: CommunityCreator[] = [];
  byAuthor.forEach((moments, userId) => {
    // Distinct MEDIA items, not tiles of the same photo counted twice.
    const seen = new Set<string>();
    let clips = 0;
    let photos = 0;
    for (const m of moments) {
      const id = m.mediaId ?? `${m.post.id}-${m.mediaIndex ?? 0}`;
      if (seen.has(id)) continue;
      seen.add(id);
      if (m.mediaType === 'video') clips += 1;
      else photos += 1;
    }
    const total = clips + photos;
    if (total < CREATOR_ITEM_FLOOR) return;

    // THE FRAME IS ONE OF THEIR OWN: prefer an item with a picture to show.
    const frame = moments.find((m) => !!m.thumbnail) ?? moments[0];
    if (!frame) return;

    creators.push({
      userId,
      displayName: frame.post.displayName || 'Player',
      avatarUrl: frame.post.avatarUrl || null,
      clips,
      photos,
      frame,
      moments,
      isFriend: !!friendIds?.has(userId),
      playedOverlap: moments.some((m) => !!playedCourseIds?.has(m.courseId)),
    });
  });

  return creators.sort(
    (a, b) =>
      Number(b.isFriend) - Number(a.isFriend) ||
      Number(b.playedOverlap) - Number(a.playedOverlap) ||
      b.clips + b.photos - (a.clips + a.photos),
  );
}

export function useCommunityCreators(args: Args): CommunityCreator[] {
  const { pool, viewerId, friendIds, playedCourseIds } = args;
  return useMemo(
    () => buildCommunityCreators({ pool, viewerId, friendIds, playedCourseIds }),
    [pool, viewerId, friendIds, playedCourseIds],
  );
}

export default useCommunityCreators;
