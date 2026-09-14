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
 * TWO LAYERS NOW ENFORCE THIS, AND THAT IS DELIBERATE (BEN'S RULING).
 * docs/sql/explore_stream_retire_standing_claims.sql pushes the rules that can
 * be expressed set-based down into get_explore_stream: rank_hold is no longer
 * emitted at all, and rank_down / rank_up / played_nochange are emitted only in
 * the news lane, only with a real standing movement, and never on another
 * member's round for played_nochange. A function that states claims the client
 * must delete cannot be read at face value, and raw RPC output is something we
 * now audit against.
 *
 * THE ELECTION BELOW STAYS HERE. One card per course per change is an election
 * over the rows that survive PLACEMENT (cadence, ring cap, author cap, deferral
 * queue, relaxation), which SQL does not know when it types the consequence.
 * Rules 5 and 6 travel with it.
 *
 * THIS GATE IS NOT REMOVED NOW THAT SQL DOES PART OF THE SAME JOB. Defence in
 * depth on a claim this page has already got wrong twice. Two layers agreeing is
 * fine; one layer silently carrying the other is what was ended.
 *
 * THE VIEWER'S OWN ROUNDS ARE UNTOUCHED. rank_up on a round the viewer posted is

 * about their own play and already fires once per round, so it passes through
 * this gate unchanged. rank_hold is RETIRED at the consequence engine (A STANDING
 * CLAIM REQUIRES A CHANGE) and is no longer emitted; the kind name stays here so
 * any legacy persisted payload is still stripped rather than trusted.
 *
 * STRIPPING A CLAIM IS NOT HIDING A CARD. A card that loses its rank
 * consequence keeps its place, its photo and its figures and falls through to
 * the plain or notable headline - the card still states what happened.
 *
 * THESE CARDS DO NOT READ THE STANDING BOARD SELECTOR, AND MUST NOT BE MADE TO
 * (Ben's ruling, §3e). "Where you stand" gained a net/gross dropdown; the cards
 * stay on gross and never consult it. A card is a dated statement about a round
 * that happened. A headline that flips because a dropdown moved stops being a
 * record of anything - the same round would read as a rise this minute and a
 * fall the next. The shelf is a live view and may change under a control; a
 * record may not. Do not "fix" this later by making the card follow the shelf
 * for consistency: the inconsistency is the correct behaviour.
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
    /* A NO-MOVEMENT KIND IS STRIPPED WHOEVER PLAYED THE ROUND. The own-round
       pass-through below covers rank_up only; played_nochange on the viewer's
       own round is the same "nothing changed" card by another name. */
    if (isOwn(item) && item.lane !== 'backlog' && MOVEMENT_KINDS.has(kind)) return item;
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
