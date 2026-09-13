import type { StreamItem } from './streamItem';

/**
 * "ON YOUR LIST" SECOND LINE (BRIEF_EXPLORE_MAGAZINE PHASE D §5a).
 *
 * C1 flagged that this shelf's second line fell back to the course AREA because
 * no recent-event source was wired to it. Flagging rather than faking it was
 * right; this is the wiring.
 *
 * IT READS WHAT IS ALREADY ON THE PAGE — NO SECOND QUERY. The ranker's rows
 * carry the events its consequence CTE computed: a round that took a course
 * record, a round that is the recent low, a new rating on the course. Those rows
 * are already in the member's hand, so the shelf reads them instead of asking
 * the database a per-tile question.
 *
 * IT NEVER STATES AN EVENT THAT DID NOT HAPPEN. Two rules enforce that:
 *   1. only a fact the row actually carries becomes a line - a rating line needs
 *      a rating, a low line needs a gross, a record line needs the record flag
 *      or the record consequence;
 *   2. A TIE IS A REASON TO SAY NOTHING. If two DIFFERENT event kinds arrive at
 *      the same strength for one course, the course renders its AREA. This is
 *      the same ruling the record signal takes, and the area fallback is
 *      CORRECT - not a placeholder.
 */

export type ListEventKind = 'record' | 'low' | 'rating';

export interface ListEvent {
  kind: ListEventKind;
  /** Strongest first: a record outranks a low, a low outranks a new rating. */
  strength: number;
  gross?: number | null;
  rating?: number | null;
}

const STRENGTH: Record<ListEventKind, number> = { record: 3, low: 2, rating: 1 };

/** The event a single ranked row asserts about its subject course, if any. */
function eventOf(item: StreamItem): ListEvent | null {
  const f = item.facts;
  const kind = item.consequence?.kind;

  if (item.kind === 'round') {
    if (f.is_course_record || kind === 'record_taken' || kind === 'record_lost') {
      return { kind: 'record', strength: STRENGTH.record, gross: f.gross ?? null };
    }
    /* A NEW LOW is the viewer's own new low or the course's recent low the RPC
       returned - never merely "someone played here". */
    if (kind === 'list_new_low' && f.gross != null) {
      return { kind: 'low', strength: STRENGTH.low, gross: f.gross };
    }
    return null;
  }

  if (item.kind === 'course') {
    if (f.course_event === 'low' && f.low_gross != null) {
      return { kind: 'low', strength: STRENGTH.low, gross: f.low_gross };
    }
    if (f.course_event === 'ratings' && f.ratings_burst_mean != null) {
      return { kind: 'rating', strength: STRENGTH.rating, rating: f.ratings_burst_mean };
    }
    return null;
  }

  if (item.kind === 'review' && f.rating != null) {
    return { kind: 'rating', strength: STRENGTH.rating, rating: f.rating };
  }

  return null;
}

/**
 * course_id -> the strongest event asserted about it, or null where the page
 * holds no event OR holds a tie between two kinds. A null entry means "render
 * the area", which is what the caller does with an absent one too.
 */
export function listCourseEvents(items: StreamItem[]): Map<string, ListEvent | null> {
  const best = new Map<string, ListEvent | null>();
  for (const item of items) {
    const courseId = item.subject?.course_id;
    if (!courseId) continue;
    const event = eventOf(item);
    if (!event) continue;
    const existing = best.get(courseId);
    if (existing === undefined) {
      best.set(courseId, event);
      continue;
    }
    /* Already ambiguous, or newly ambiguous: an equal-strength DIFFERENT kind
       cannot be resolved honestly, so the course keeps no event at all. */
    if (existing === null) continue;
    if (event.strength > existing.strength) best.set(courseId, event);
    else if (event.strength === existing.strength && event.kind !== existing.kind) best.set(courseId, null);
  }
  return best;
}
