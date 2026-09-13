import type { StreamItem } from './streamItem';
import type { StandingRow } from './useViewerStanding';

/**
 * ONE RANK CARD PER COURSE PER CHANGE (BRIEF: EXPLORE - ONE RANK CARD PER
 * COURSE PER CHANGE).
 *
 * THE CARD IS KEYED TO THE CHANGE, NOT TO THE ROUND. Before this gate every
 * round anyone played at a course the viewer has played carried the viewer's
 * CURRENT standing, so eighteen rounds at one club produced eighteen
 * near-identical cards, and a 2021 round in the backlog announced a
 * present-tense consequence it had nothing to do with.
 *
 * THE RULES, all of them read off get_viewer_standing - NO NEW QUERY:
 *
 *  1. delta NULL (no last-seen stamp, a first-ever visit) -> NO rank card.
 *     Nothing is "since you last looked" on a first look.
 *  2. delta 0 (the board has not moved since the stamp) -> NO rank card. A
 *     member who visits twice in a day sees none of these, and that is correct.
 *  3. delta != 0 -> EXACTLY ONE rank card for that course, however many rounds
 *     caused the movement.
 *  4. A BACKLOG ROUND CAN NEVER CARRY A STANDING CLAIM, whatever delta says.
 *     A round that arrived outside the news window did not change anything this
 *     week. It may still render as a plain or notable card; it simply never
 *     speaks about the viewer's standing. This rule is the direct fix for the
 *     two four-year-old rounds that each claimed "puts you 8 of the 18".
 *  5. ATTRIBUTION IS THE OCCASION, NOT THE CAUSE. The surviving card is the
 *     MOST RECENT qualifying round at that course (newest play_date, ties broken
 *     by arrival then id). Which individual round displaced the viewer is not
 *     computed: that attribution is fragile and getting it wrong is what
 *     produced the false claim above.
 *  6. NO OCCASION, NO CARD. delta != 0 with nothing resolvable at that course
 *     on this page (a deletion, a correction, a backfill) renders no rank card
 *     rather than an invented one.
 *
 * THE VIEWER'S OWN ROUNDS ARE UNTOUCHED. rank_up and rank_hold on a round the
 * viewer posted are about their own play and already fire once per round, so
 * they pass through this gate unchanged.
 *
 * STRIPPING A CLAIM IS NOT HIDING A CARD. A card that loses its rank
 * consequence keeps its place, its photo and its figures and falls through to
 * the plain or notable headline - the card still states what happened.
 */

/** Consequences that speak about where the viewer stands. */
const STANDING_KINDS = new Set(['rank_down', 'rank_up', 'rank_hold', 'played_nochange']);

/** The kinds this gate rations to one per course per movement. */
const MOVEMENT_KINDS = new Set(['rank_down', 'rank_up']);

function isOwn(item: StreamItem): boolean {
  return !!item.who?.is_viewer;
}

function occasionRank(item: StreamItem): [string, string, string] {
  return [item.facts.play_date ?? '', item.facts.arrived_at ?? '', item.id];
}

/** Newest play_date wins; then arrival; then id, so the choice is stable. */
function newer(a: StreamItem, b: StreamItem): StreamItem {
  const ka = occasionRank(a);
  const kb = occasionRank(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] === kb[i]) continue;
    return ka[i] > kb[i] ? a : b;
  }
  return a;
}

export interface RankCardOutcome {
  items: StreamItem[];
  /** Diagnostics for the before/after report. Never rendered. */
  stats: {
    before: number;
    after: number;
    courses: number;
    strippedBacklog: number;
    strippedNoMovement: number;
    strippedDuplicate: number;
  };
}

export function applyRankCardRule(
  items: StreamItem[],
  standing: Map<string, StandingRow>,
): RankCardOutcome {
  const stats = {
    before: 0,
    after: 0,
    courses: 0,
    strippedBacklog: 0,
    strippedNoMovement: 0,
    strippedDuplicate: 0,
  };

  /* PASS ONE: elect one occasion per course among the movement candidates. */
  const elected = new Map<string, StreamItem>();
  for (const item of items) {
    const kind = item.consequence?.kind;
    if (!kind || !MOVEMENT_KINDS.has(kind)) continue;
    if (isOwn(item)) continue;
    const courseId = item.subject?.course_id;
    if (!courseId) continue;
    if (item.lane === 'backlog') continue;
    if (!item.facts.play_date) continue;
    const row = standing.get(courseId);
    if (!row || row.delta == null || row.delta === 0) continue;
    const held = elected.get(courseId);
    elected.set(courseId, held ? newer(held, item) : item);
  }
  stats.courses = elected.size;

  /* PASS TWO: every other standing claim is dropped, and the card falls through
     to the plain or notable headline it can honestly carry. */
  const out = items.map((item) => {
    const kind = item.consequence?.kind;
    if (!kind || !STANDING_KINDS.has(kind)) return item;
    if (isOwn(item) && item.lane !== 'backlog') return item;
    stats.before += 1;

    if (item.lane === 'backlog') {
      stats.strippedBacklog += 1;
      return { ...item, consequence: null };
    }
    if (!MOVEMENT_KINDS.has(kind)) {
      /* played_nochange on another member's round is a standing claim with no
         movement behind it. It has no occasion to be about. */
      stats.strippedNoMovement += 1;
      return { ...item, consequence: null };
    }
    const courseId = item.subject?.course_id;
    const winner = courseId ? elected.get(courseId) : undefined;
    if (!winner) {
      stats.strippedNoMovement += 1;
      return { ...item, consequence: null };
    }
    if (winner.id !== item.id) {
      stats.strippedDuplicate += 1;
      return { ...item, consequence: null };
    }
    stats.after += 1;
    return item;
  });

  return { items: out, stats };
}
