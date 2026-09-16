import type { StreamItem } from './streamItem';

/**
 * SHAPE IS DECIDED BY KIND, NOTHING ELSE (BRIEF_EXPLORE_TWO_SHAPES §2).
 *
 * The earned hero is RETIRED. A review always renders text ON the photograph, a
 * round always renders text UNDER it, at every position including 0, so a member
 * can read the pattern instead of learning a ranking rule. What used to earn a
 * bigger card now earns a CALLOUT PANEL (§5): the layout stays put and the
 * achievement is marked.
 *
 * WHAT SURVIVES is the notability predicate, renamed to say what it is for: it
 * blocks PAIRING, so a round with something to say is never squeezed into a
 * 124px tile beside another.
 */

const NOTABLE_CONSEQUENCES = new Set(['record_taken', 'record_lost', 'rank_up']);

/** Five birdies is the server's notability threshold in get_explore_stream. */
const NOTABLE_BIRDIES = 5;

export function isNotableRound(item: StreamItem): boolean {
  return (
    NOTABLE_CONSEQUENCES.has(item.consequence?.kind ?? '') ||
    (item.facts.holes_in_one ?? 0) > 0 ||
    (item.facts.albatrosses ?? 0) > 0 ||
    (item.facts.eagles ?? 0) > 0 ||
    (item.facts.birdies ?? 0) >= NOTABLE_BIRDIES ||
    item.facts.clean_card === true ||
    (item.facts.to_par ?? 0) < 0
  );
}

/**
 * THE ACHIEVEMENT CALLOUT (§5). ROUNDS ONLY, one per card, the highest priority
 * that holds.
 *
 * ONLY GOOD THINGS GET A CALLOUT. record_lost and rank_down are consequences a
 * member reads in the headline; under par on its own is already red in the chip
 * and is not an achievement panel.
 *
 * A BACKLOG ROUND NEVER TAKES A RECORD OR RANK CALLOUT: the board it would claim
 * moved months ago, so the panel would announce a change that is not news.
 *
 * SUBLINES COME FROM FACTS THE ITEM CARRIES AND NOWHERE ELSE. Where the hole is
 * unknown the title stands alone; nothing here guesses one.
 */
export type AchievementCallout =
  | { kind: 'record' }
  | { kind: 'net_record' }
  | { kind: 'rank_up'; rank: number | null }
  | { kind: 'ace'; hole: number | null }
  | { kind: 'albatross'; hole: number | null }
  | { kind: 'eagle'; hole: number | null }
  | { kind: 'birdies'; count: number }
  | { kind: 'clean' };

export interface CalloutHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

/** The hole a single notable score happened on, read from the round's own hole
 *  rows. A count other than one leaves the hole unnamed: "on the 7th" must not
 *  stand for two eagles. */
function singleHole(
  holes: CalloutHole[] | undefined,
  kind: 'ace' | 'albatross' | 'eagle',
): number | null {
  if (!holes || holes.length === 0) return null;
  const hits: number[] = [];
  for (const h of holes) {
    if (h.strokes == null) continue;
    if (kind === 'ace') {
      if (h.strokes === 1) hits.push(h.holeNo);
      continue;
    }
    if (h.par == null) continue;
    const diff = h.strokes - h.par;
    if (kind === 'albatross' && diff === -3) hits.push(h.holeNo);
    if (kind === 'eagle' && diff === -2) hits.push(h.holeNo);
  }
  return hits.length === 1 ? hits[0] : null;
}

export function calloutFor(item: StreamItem, holes?: CalloutHole[]): AchievementCallout | null {
  if (item.kind !== 'round') return null;
  const { facts, consequence, lane } = item;
  /* A BACKLOG ROUND NEVER CLAIMS THE BOARD: it is entered after the fact and the
     standing it would announce is not news. */
  const boardClaimAllowed = lane !== 'backlog';
  /* ONLY GOOD THINGS GET A CALLOUT. A round that LOST the record carries
     is_course_record from the row it displaced, so the loss is checked FIRST and
     no crown can be drawn on top of it. */
  const lostIt = consequence?.kind === 'record_lost' || consequence?.kind === 'rank_down';

  /* "NEW COURSE RECORD" IS A CLAIM ABOUT NOW, so it may only be drawn from the
     consequence, which roundConsequence() emits ONLY when this round's identity
     still matches the CURRENT rank-1 row in gam_course_legends. facts
     .is_course_record is the round's own stored flag: it is not revoked when a
     later round by another member beats it, so it is NEVER sufficient here. A
     beaten record therefore draws no crown, and the round keeps its plain
     headline. */
  if (boardClaimAllowed && !lostIt && consequence?.kind === 'record_taken') {
    return { kind: 'record' };
  }
  /* THE NET CROWN (C4). net_record is the RPC's claim about the NET board at the
     moment the round arrived, so it is trusted the same way the gross
     consequence is - and refused on the same two grounds: a backlog round is
     not news, and a round that lost something is not celebrated. A member with
     no net facts (private handicap, or the SQL not applied) simply never has
     the flag. */
  if (boardClaimAllowed && !lostIt && facts.net_record === true) {
    return { kind: 'net_record' };
  }
  if (boardClaimAllowed && consequence?.kind === 'rank_up') {
    return { kind: 'rank_up', rank: consequence.n ?? null };
  }
  if ((facts.holes_in_one ?? 0) > 0) return { kind: 'ace', hole: singleHole(holes, 'ace') };
  if ((facts.albatrosses ?? 0) > 0) return { kind: 'albatross', hole: singleHole(holes, 'albatross') };
  if ((facts.eagles ?? 0) > 0) return { kind: 'eagle', hole: singleHole(holes, 'eagle') };
  /* FIVE BIRDIES RETURNS TO THE ACHIEVEMENT LANE. The C3 strip no longer has a
     birdies figure cell, while VS HCP now carries the beat-handicap signal and
     handicap cut remains disabled. */
  if ((facts.birdies ?? 0) >= NOTABLE_BIRDIES) return { kind: 'birdies', count: facts.birdies as number };
  if (facts.clean_card === true) return { kind: 'clean' };
  return null;
}
