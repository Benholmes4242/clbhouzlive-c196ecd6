/**
 * WF2 — pure rules for the Who to follow rail in the Clubhouse feed
 * (wf2-feed-rail.html, signed off).
 *
 * The rail shows the SAME suggestions as Find people (get_people_suggestions /
 * get_suggested_businesses via usePeopleSuggestions) in a feed-specific order:
 * the your_club business first, then golfers in the server's order, with the
 * next non-your_club business (coach, near_club, popular — server order) after
 * every 3 golfers. Businesses left over once the golfers run out are NOT
 * appended: the brief defines the interleave only, so this module never
 * invents a position the server did not imply.
 *
 * No locale, no DOM, no network: reason lines are { key, def, vars } Copy
 * descriptors the component hands to t(), same as findPeopleRules.
 */
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { businessCategoryWord } from '@/lib/business/businessHero';
import {
  businessReason,
  golferReason,
  type BusinessSuggestion,
  type Copy,
  type PersonSuggestion,
} from './findPeopleRules';

export type RailCard =
  | { kind: 'person'; person: PersonSuggestion }
  | { kind: 'business'; business: BusinessSuggestion };

/** Session-dismissal / followed-set key: `p:{user_id}` or `b:{business_id}`. */
export function railCardId(card: RailCard): string {
  return card.kind === 'person' ? `p:${card.person.user_id}` : `b:${card.business.business_id}`;
}

/** The suggestion_dismissals row identity for a card. */
export function railCardActor(card: RailCard): { actor_type: 'personal' | 'business'; actor_id: string } {
  return card.kind === 'person'
    ? { actor_type: 'personal', actor_id: card.person.user_id }
    : { actor_type: 'business', actor_id: card.business.business_id };
}

/** The card's reason_type, for analytics. */
export function railCardReasonType(card: RailCard): string {
  return card.kind === 'person' ? card.person.reason_type : card.business.reason_type;
}

/**
 * Rail order (WF2 §1): the your_club business first (if any), then golfers in
 * the order the server returned them, with the next non-your_club business
 * after every 3 golfers.
 */
export function railCards(people: PersonSuggestion[], biz: BusinessSuggestion[]): RailCard[] {
  const out: RailCard[] = [];
  for (const b of biz) {
    if (b.reason_type === 'your_club') out.push({ kind: 'business', business: b });
  }
  const rest = biz.filter((b) => b.reason_type !== 'your_club');
  let restIdx = 0;
  people.forEach((p, i) => {
    out.push({ kind: 'person', person: p });
    if ((i + 1) % 3 === 0 && restIdx < rest.length) {
      out.push({ kind: 'business', business: rest[restIdx] });
      restIdx += 1;
    }
  });
  return out;
}

export const RAIL_SLOT_SIZE = 10;
export const RAIL_MIN_CARDS = 3;

/**
 * Slot 1 takes cards 0–9, slot 2 takes cards 10–19 (WF2 §1). Cards hidden
 * this session are filtered out BEFORE slicing, so the rest close up. A slot
 * with fewer than 3 cards renders nothing.
 */
export function railSlotCards(cards: RailCard[], slot: 1 | 2, hidden: ReadonlySet<string>): RailCard[] {
  const visible = cards.filter((c) => !hidden.has(railCardId(c)));
  const slice = visible.slice((slot - 1) * RAIL_SLOT_SIZE, slot * RAIL_SLOT_SIZE);
  return slice.length >= RAIL_MIN_CARDS ? slice : [];
}

/**
 * Feed placement (WF2 §2): the rail sits after the 3rd post (slot 1, above
 * postIndex 3) and after the 15th post (slot 2, above postIndex 15). No rail
 * in a feed with fewer than 4 posts.
 */
export function railSlotForPostIndex(postIndex: number, postCount: number): 1 | 2 | null {
  if (postCount < 4) return null;
  if (postIndex === 3) return 1;
  if (postIndex === 15) return 2;
  return null;
}

/**
 * Rail golfer reason (WF2 §5): a club golfer reads "Also a member at {club}"
 * and played_with reads "Played {shortCourseName} with you" (no course:
 * "Played with you"); every other golfer reason is the Find people line.
 */
export function railGolferReason(g: PersonSuggestion): Copy | null {
  if (g.reason_type === 'club') {
    return {
      key: 'findPeople.rail.reason.club',
      def: 'Also a member at {{club}}',
      vars: { club: g.reason_club_name ?? '' },
    };
  }
  if (g.reason_type === 'played_with') {
    const course = shortCourseName(g.reason_course_name ?? '');
    return course
      ? { key: 'findPeople.rail.reason.playedWith', def: 'Played {{course}} with you', vars: { course } }
      : { key: 'findPeople.rail.reason.playedWithFallback', def: 'Played with you' };
  }
  return golferReason(g);
}

/**
 * Rail business reason (WF2 §5): the your_club business reads "Your club";
 * every other business uses the Find people Businesses-tab line with the same
 * category label the page uses.
 */
export function railBusinessReason(b: BusinessSuggestion, categoryLabel: string): Copy | null {
  if (b.reason_type === 'your_club') {
    return { key: 'findPeople.rail.reason.yourClub', def: 'Your club' };
  }
  return businessReason(b, 'businesses', categoryLabel);
}

/**
 * The Find people page's categoryOf, moved here (WF2 §5) so the page and the
 * rail share one category label. No copy change on the page.
 */
export function businessCategoryLabel(b: BusinessSuggestion): string {
  return b.category === 'Golf Club'
    ? 'Golf club'
    : businessCategoryWord(b.category, (_key, fallback) => fallback);
}

/* ── Pros to follow / Creators to follow (wtf-pros-creators-rails, Option A) ── */

export type FollowKind = 'pro' | 'creator';

/** One get_people_to_follow_by_kind row (run by Ben; audience is server-owned). */
export interface KindPerson {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  pro_kind: string | null;
  pro_tour: string | null;
  pro_club: string | null;
  videos: number | null;
  mutual_count: number | null;
  followers: number | null;
}

/**
 * Feed placement for the kind rails: Pros above postIndex 10, Creators above
 * postIndex 21. Sibling of railSlotForPostIndex, which keeps slots 1 and 2.
 * CardFeed only asks for posts that exist, so a feed that never reaches the
 * post never renders the rail.
 */
export function kindRailForPostIndex(postIndex: number, postCount: number): FollowKind | null {
  if (postIndex === 10 && postCount > 10) return 'pro';
  if (postIndex === 21 && postCount > 21) return 'creator';
  return null;
}

/** A kind rail qualifies with 3+ cards left after this session's hides. */
export function kindRailVisible(rows: KindPerson[], hidden: ReadonlySet<string>): KindPerson[] {
  const visible = rows.filter((r) => !hidden.has(`p:${r.user_id}`));
  return visible.length >= RAIL_MIN_CARDS ? visible : [];
}

/** Reason line: pro role plus club/tour (dropped when null), or video count. */
export function kindReason(kind: FollowKind, r: KindPerson): Copy {
  if (kind === 'creator') {
    const n = r.videos ?? 0;
    return {
      key: n === 1 ? 'findPeople.kind.reason.creatorOne' : 'findPeople.kind.reason.creator',
      def: n === 1 ? 'Creator · 1 video' : 'Creator · {{count}} videos',
      vars: { count: n },
    };
  }
  if (r.pro_kind === 'tour_pro') {
    return r.pro_tour
      ? { key: 'findPeople.kind.reason.tour', def: 'Tour professional · {{tour}}', vars: { tour: r.pro_tour } }
      : { key: 'findPeople.kind.reason.tourBare', def: 'Tour professional' };
  }
  return r.pro_club
    ? { key: 'findPeople.kind.reason.teaching', def: 'Teaching professional · {{club}}', vars: { club: r.pro_club } }
    : { key: 'findPeople.kind.reason.teachingBare', def: 'Teaching professional' };
}

/** Slot line when there is no amber activity: mutuals, then followers, else none. */
export function kindFigures(r: KindPerson): Copy | null {
  const m = r.mutual_count ?? 0;
  if (m > 0) return { key: 'findPeople.kind.mutual', def: 'Followed by {{count}} you follow', vars: { count: m } };
  const f = r.followers ?? 0;
  if (f > 0) {
    return {
      key: f === 1 ? 'findPeople.kind.followerOne' : 'findPeople.kind.followers',
      def: f === 1 ? '1 follower' : '{{count}} followers',
      vars: { count: f.toLocaleString('en-GB') },
    };
  }
  return null;
}

/** Adapt a kind row to the shared rail card's person shape. */
export function kindRowToPerson(kind: FollowKind, r: KindPerson): PersonSuggestion {
  return {
    user_id: r.user_id,
    display_name: r.display_name,
    username: r.username,
    profile_photo_url: r.profile_photo_url,
    reason_type: kind,
    reason_club_name: null,
    reason_course_name: null,
    reason_date: null,
    mutual_count: r.mutual_count,
    recent_rounds: null,
    rounds_total: null,
    handicap_index: null,
    is_verified: null,
  };
}
