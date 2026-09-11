import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

/**
 * THE UNIT'S CONTRACT (BRIEF_EXPLORE_MAGAZINE §6a).
 *
 * ONE shape for every content type. A type that does not fit is a reason to
 * change this contract, never a reason to fork the card.
 *
 * PHASE A IS CLIENT-COMPOSED AND TEMPORARY. get_explore_stream (Phase D) will
 * return these rows already ordered with a keyset cursor; until then
 * useExploreStreamClient assembles them from hooks that already ship. The
 * fields that Phase A cannot honestly fill are left null rather than guessed:
 *   - `ring` is only 'own' or null, because geography is Phase C. Nothing on
 *     this page claims a club, a county or a country yet, so the outer-ring
 *     cadence cap has nothing to act on.
 *   - rank consequences (rank_down / rank_up / rank_hold / record_taken with a
 *     gap / played_nochange) need the viewer's standing per course, which is
 *     Phase B's get_viewer_standing. They are declared here and never emitted
 *     by Phase A.
 *   - `lane` is always 'news' in Phase A. The backlog lane needs arrived_at
 *     versus play_date from the RPC (§6e) and lands in Phase D.
 */

export type ExploreKind = 'round' | 'review' | 'course' | 'story' | 'clip' | 'watch' | 'moment';

export type ExploreRing = 'own' | 'club' | 'county' | 'country' | 'world';

export type ExploreLane = 'news' | 'backlog';

/** §6b, highest weight first. The order IS the weighting. */
export const CONSEQUENCE_ORDER = [
  'record_taken',
  'record_lost',
  'rank_down',
  'rank_up',
  'rank_hold',
  'list_new_low',
  'list_first',
  'review_disagree',
  'review_on_list',
  'review_played',
  'circle_round',
  'played_nochange',
  'backlog_own_best',
  'platform_notable',
] as const;

export type ConsequenceKind = (typeof CONSEQUENCE_ORDER)[number];

/** 1.0 for the heaviest kind, descending in equal steps. Never 0. */
export function consequenceWeight(kind: ConsequenceKind | null | undefined): number {
  if (!kind) return 0;
  const index = CONSEQUENCE_ORDER.indexOf(kind);
  if (index < 0) return 0;
  return (CONSEQUENCE_ORDER.length - index) / CONSEQUENCE_ORDER.length;
}

export const RING_WEIGHT: Record<ExploreRing, number> = {
  own: 1,
  club: 0.8,
  county: 0.55,
  country: 0.35,
  world: 0.2,
};

export interface Consequence {
  kind: ConsequenceKind;
  /** The viewer's own figure, when the consequence names one. */
  n?: number | null;
  /** The field the figure sits in ("of 42"). */
  of?: number | null;
  /** Places moved, strokes of gap — always a magnitude, never a sign. */
  delta?: number | null;
  /** The other member's rating, for review_disagree. */
  theirs?: number | null;
  /** The viewer's rating, for review_disagree. */
  yours?: number | null;
  held_by_viewer?: boolean;
}

export interface StreamSubject {
  course_id: string | null;
  course_name: string | null;
  region: string | null;
  sub_country: string | null;
  image_url: string | null;
  /** TRUE while the image/region resolver is still in flight (§0 unresolved is not absent). */
  pending: boolean;
}

export interface StreamWho {
  user_id: string | null;
  display_name: string | null;
  photo_url: string | null;
  is_viewer: boolean;
}

export interface StreamFacts {
  gross?: number | null;
  course_par?: number | null;
  to_par?: number | null;
  net?: number | null;
  stableford?: number | null;
  score_id?: string | null;
  connection_id?: string | null;
  play_date?: string | null;
  /** Ingest time. Freshness is keyed on THIS, never on play_date (§6e). */
  arrived_at?: string | null;
  rating?: number | null;
  rating_n?: number | null;
  review_id?: string | null;
  first_sentence?: string | null;
  top100_world?: number | null;
  top100_regional?: number | null;
  post_id?: string | null;
  media_id?: string | null;
  duration_s?: number | null;
  story_slug?: string | null;
  headline?: string | null;
  source?: string | null;
  published_at?: string | null;
  /** Notable facts a round carries; the headline reads them, never a feat string. */
  birdies?: number | null;
  eagles?: number | null;
  albatrosses?: number | null;
  holes_in_one?: number | null;
  clean_card?: boolean | null;
  is_course_record?: boolean | null;
  hcp_at_time?: number | null;
}

/** What a tap needs. Carried rather than re-fetched: the page opens the same
 *  sheets and viewer these hooks already feed elsewhere. */
export interface StreamPayload {
  round?: CircleRoundRow;
  review?: LatestReview;
  moment?: Moment;
  media?: CommunityLibraryItem;
}

export interface StreamItem {
  id: string;
  kind: ExploreKind;
  ring: ExploreRing | null;
  lane: ExploreLane;
  /** Ordering and debugging only. NEVER rendered. */
  score: number;
  consequence: Consequence | null;
  subject: StreamSubject | null;
  who: StreamWho | null;
  facts: StreamFacts;
  payload: StreamPayload;
  /** True when the item arrived before the viewer's last look at this surface. */
  seen: boolean;
}
