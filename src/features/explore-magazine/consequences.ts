import type { Consequence, StreamFacts } from './streamItem';
import type { StandingRow } from './useViewerStanding';
import type { CourseRecordSignal } from './useCourseRecordSignal';

/**
 * THE RETIRED KINDS, AND THE SERVER (Sep 2026 ruling).
 *
 * The deployed get_explore_stream still ranks and returns rows whose consequence
 * is one of the two retired kinds; changing that is SQL and is Ben's to run. So
 * the client admits server rows through the same rule the engine below now
 * follows: a retired kind is not a card, and the round only survives on its own
 * merits — the viewer's own round, or a round notable in its own right.
 *
 * CIRCLE MEMBERSHIP IS NOT ON A SERVER ROW, so a followed member's otherwise
 * ordinary round arriving with a retired kind cannot be re-admitted as
 * circle_round here. It is dropped. That is a stated narrowing of the
 * fall-through on the RPC path, not a second rule.
 */
const RETIRED_KINDS = new Set<string>(['rank_down', 'played_nochange']);

export function isRetiredConsequenceKind(kind: string | null | undefined): boolean {
  return !!kind && RETIRED_KINDS.has(kind);
}

/** Notable in its own right — the same facts the platform_notable kind means. */
export function isNotableRoundFacts(facts: StreamFacts | null | undefined): boolean {
  if (!facts) return false;
  return (
    (facts.holes_in_one ?? 0) > 0 ||
    (facts.albatrosses ?? 0) > 0 ||
    (facts.eagles ?? 0) > 0 ||
    (facts.to_par ?? 0) < 0 ||
    facts.is_course_record === true
  );
}

/**
 * One decision for a server row carrying a retired kind:
 *   - the viewer's own round  -> keep it, with no consequence;
 *   - notable in its own right -> keep it as platform_notable;
 *   - otherwise                -> null, meaning NOT A CANDIDATE.
 */
export function admitRetired(
  facts: StreamFacts | null | undefined,
  isViewer: boolean,
): { consequence: Consequence | null } | null {
  if (isViewer) return { consequence: null };
  if (isNotableRoundFacts(facts)) return { consequence: { kind: 'platform_notable' } };
  return null;
}

/**
 * THE CONSEQUENCE ENGINE (BRIEF_EXPLORE_MAGAZINE §3a, PHASE B2).
 *
 * One function, one round in, at most one consequence out. Every figure it
 * emits is READ, never derived a second way:
 *
 *   n / of    the viewer's rank and the field size, from get_viewer_standing.
 *             field_now is the MATCHED count, the same figure the Champions tab
 *             shows, so the headline and the "Where you stand" shelf on the
 *             same page cannot disagree (B1 ruling). No field size is ever
 *             recomputed here.
 *   record    gam_course_legends, current rank-1 lowest gross. §3e.
 *   passed    the viewer's own best gross at that course, which decides only
 *             WHETHER a round passed them, never where they now sit.
 *
 * §3b OTHERS ONLY EVER MOVE YOU DOWN. A round by another member can produce
 * record_lost and nothing better; the good news comes from the viewer's own
 * rounds, which is exactly why §3c admits them.
 *
 * NO CONSEQUENCE, NO INVENTED SENTENCE. Where none of the typed kinds holds, a
 * round by another member falls through to list_first, circle_round or
 * platform_notable, and otherwise IS NOT A CANDIDATE. The viewer's own round is
 * always their own news and simply carries no consequence. A round with no
 * resolvable course or score id still does not render at all; that gate is in
 * the stream, not here.
 */

export interface RoundConsequenceInput {
  courseId: string | null;
  userId: string | null;
  gross: number | null;
  playDate: string | null;
  isSelf: boolean;
  /** True only when the row came from the shared personal-circle source. */
  isCircle: boolean;
  /** Settled notable feat, never a substitute for a geographic consequence. */
  isNotable: boolean;
}

export interface ConsequenceSources {
  /** course_id -> the viewer's standing on that course's lowest gross board. */
  standing: Map<string, StandingRow>;
  records: CourseRecordSignal;
  /** course_id -> the viewer's own best 18-hole gross there. */
  bests: Map<string, number>;
  /** Courses on the viewer's list. */
  shortlist: Set<string>;
}

/** Does this round's identity match the CURRENT record row for that course? */
function isRecordRound(input: RoundConsequenceInput, records: CourseRecordSignal): boolean {
  if (!input.courseId || !input.userId || input.gross == null || !input.playDate) return false;
  const holder = records.holders.get(input.courseId);
  if (!holder) return false;
  return (
    holder.user_id === input.userId &&
    holder.value === input.gross &&
    holder.attained_on != null &&
    holder.attained_on === input.playDate.slice(0, 10)
  );
}

export function roundConsequence(input: RoundConsequenceInput, sources: ConsequenceSources): Consequence | null {
  const { courseId, gross, isSelf } = input;
  const stand = courseId ? sources.standing.get(courseId) ?? null : null;
  const myBest = courseId ? sources.bests.get(courseId) ?? null : null;
  const field = stand?.field_now ?? null;
  /* MOVEMENT IS A MAGNITUDE, NEVER A SIGN (§6b). The standing delta is
     rank_then - rank_now, so positive is an improvement. */
  const moved = stand?.delta != null && stand.delta !== 0 ? Math.abs(stand.delta) : null;

  /* 1. THE RECORD BOOK FIRST — the heaviest kind there is. */
  if (isRecordRound(input, sources.records)) {
    const takenFromViewer =
      !isSelf && !!courseId && !!input.userId && sources.records.lostToViewer.has(`${courseId}:${input.userId}`);
    if (takenFromViewer) {
      return {
        kind: 'record_lost',
        n: gross ?? null,
        of: field,
        /* THE GAP IS STROKES, and only where the viewer's own best is known. */
        delta: myBest != null && gross != null && myBest > gross ? myBest - gross : null,
      };
    }
    return { kind: 'record_taken', n: gross ?? null, of: field, held_by_viewer: isSelf };
  }

  /* 2. ANOTHER MEMBER'S ROUND.
        A ROUND BY SOMEONE ELSE IS ONLY NEWS IF IT CHANGED SOMETHING. Another
        member playing a course you have played is not, by itself, an event —
        however much it moves a number you were not watching. That is why
        rank_down is gone: it fired on EVERY round at EVERY course the viewer had
        ever teed off, and eighteen rounds at one club drew eighteen
        near-identical cards whose only difference was a rank the viewer had not
        been watching. Do not reinstate it, and do not reintroduce it under
        another name.

        So these rounds fall THROUGH to whatever they qualify for on their own
        merits: the viewer's list, their circle, or a notable round. If none
        holds, the round is NOT A CANDIDATE and returns null. */
  if (!isSelf) {
    /* A COURSE ON THE VIEWER'S LIST, and that is ALL this says. Phase A read
       list_new_low off the other member's own best there, which is a fact about
       them and not a low on any list — so this emits list_first only. */
    if (courseId && sources.shortlist.has(courseId)) return { kind: 'list_first' };
    if (input.isCircle) return { kind: 'circle_round' };
    if (input.isNotable) return { kind: 'platform_notable' };
    return null;
  }

  /* 3. THE VIEWER'S OWN ROUND — the only path that can carry good news. */
  if (stand) {
    if (stand.delta != null && stand.delta > 0) {
      return { kind: 'rank_up', n: stand.rank_now, of: field, delta: moved };
    }
    /* HOLD, NOT DRIFT: they are still where they were, on a board that has a
       field to be top of. rank_then null means there is no reference, so there
       is nothing to call a hold — the round then carries NO consequence and the
       card falls back to what the round itself was, which is the honest line. */
    if (stand.rank_then != null && stand.delta === 0) {
      return { kind: 'rank_hold', n: stand.rank_now, of: field };
    }
  }
  /* THE VIEWER'S OWN ROUND IS ALWAYS A CANDIDATE — it is their own news. With no
     standing consequence it carries none, and the headline speaks the round
     (birdies, eagle, under par, or plain). played_nochange is retired. */
  return null;
}
