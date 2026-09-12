import type { Consequence } from './streamItem';
import type { StandingRow } from './useViewerStanding';
import type { CourseRecordSignal } from './useCourseRecordSignal';

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
 * record_lost or rank_down and nothing better; the good news comes from the
 * viewer's own rounds, which is exactly why §3c admits them.
 *
 * NO CONSEQUENCE, NO INVENTED SENTENCE. Where none of the typed kinds holds,
 * a round falls back to the plain kinds Phase A already shipped —
 * circle_round for another member, played_nochange for the viewer — so the card
 * states what happened and claims nothing about a board. A round with no
 * resolvable course or score id still does not render at all; that gate is in
 * the stream, not here.
 */

export interface RoundConsequenceInput {
  courseId: string | null;
  userId: string | null;
  gross: number | null;
  playDate: string | null;
  isSelf: boolean;
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

  /* 2. ANOTHER MEMBER'S ROUND. It passed the viewer only if it is better than
        the viewer's own best there, and only a course the viewer has played can
        have a standing row at all. */
  if (!isSelf) {
    if (stand && gross != null && myBest != null && gross < myBest) {
      return { kind: 'rank_down', n: stand.rank_now, of: field, delta: moved };
    }
    if (courseId && sources.shortlist.has(courseId)) {
      return gross != null ? { kind: 'list_new_low', n: gross } : { kind: 'list_first' };
    }
    return { kind: 'circle_round' };
  }

  /* 3. THE VIEWER'S OWN ROUND — the only path that can carry good news. */
  if (stand) {
    if (stand.delta != null && stand.delta > 0) {
      return { kind: 'rank_up', n: stand.rank_now, of: field, delta: moved };
    }
    /* HOLD, NOT DRIFT: they are still where they were, on a board that has a
       field to be top of. rank_then null means there is no reference, so there
       is nothing to call a hold — that is played_nochange. */
    if (stand.rank_then != null && stand.delta === 0) {
      return { kind: 'rank_hold', n: stand.rank_now, of: field };
    }
  }
  return { kind: 'played_nochange', n: stand?.rank_now ?? null, of: field };
}
