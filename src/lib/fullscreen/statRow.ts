/** FULL-SCREEN STAT ROW — the one rule for which figures a viewer slide prints
 * (FULL-SCREEN VIEWER §5). Pure: callers resolve the hole facts (shared
 * holeFacts / useCourseHoleFacts), the review's own scores and the course's
 * par, yards and members' rating (already floor-gated) and pass them in.
 *   hole slide      HOLE · PAR · YARDS · STROKE INDEX · FIELD LOSES (present cells only)
 *   review, other   OVERALL · DESIGN · CONDITION · CLUBHOUSE · FACILITIES
 *   post, other     PAR · YARDS · MEMBERS (present cells only)
 * `postHasStatRow` decides once per post, so every slide of a post renders the
 * row (or none) and the stack never jumps between slides. */
import type { HoleFacts } from '@/lib/courseMedia/holeFacts';
import { shortOrdinal } from '@/lib/courseMedia/courseGallery';
import { holeOrdinal } from '@/lib/courseMedia/holeWalk';

export type StatKey = 'hole' | 'par' | 'yards' | 'strokeIndex' | 'field' | 'overall' | 'design' | 'condition' | 'clubhouse' | 'facilities' | 'members';
export interface StatCell { key: StatKey; value: string }
export const STAT_LABELS: Record<StatKey, string> = {
  hole: 'HOLE', par: 'PAR', yards: 'YARDS', strokeIndex: 'STROKE INDEX', field: 'FIELD LOSES',
  overall: 'OVERALL', design: 'DESIGN', condition: 'CONDITION', clubhouse: 'CLUBHOUSE', facilities: 'FACILITIES', members: 'MEMBERS',
};

export interface ReviewScores { overall: number | null; design: number | null; condition: number | null; clubhouse: number | null; facilities: number | null }
export interface CourseFigures { par: number | null; yards: number | null; members: number | null }

const score = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(1));
const yardsText = (n: number) => n.toLocaleString('en-GB');

export function statCells(input: {
  holeNo: number | null;
  facts?: Pick<HoleFacts, 'par' | 'yards' | 'strokeIndex' | 'field'> | null;
  review?: ReviewScores | null;
  course?: CourseFigures | null;
}): StatCell[] {
  const { holeNo, facts, review, course } = input;
  if (holeNo != null) {
    const out: StatCell[] = [{ key: 'hole', value: shortOrdinal(holeNo) }];
    if (facts?.par != null) out.push({ key: 'par', value: String(facts.par) });
    if (facts?.yards != null) out.push({ key: 'yards', value: yardsText(facts.yards) });
    if (facts?.strokeIndex != null) out.push({ key: 'strokeIndex', value: String(facts.strokeIndex) });
    if (facts?.field != null) out.push({ key: 'field', value: facts.field });
    return out;
  }
  if (review) {
    return (['overall', 'design', 'condition', 'clubhouse', 'facilities'] as const).map((key) => ({ key, value: score(review[key]) }));
  }
  const out: StatCell[] = [];
  if (course?.par != null && course.par > 0) out.push({ key: 'par', value: String(course.par) });
  if (course?.yards != null && course.yards > 0) out.push({ key: 'yards', value: yardsText(course.yards) });
  if (course?.members != null) out.push({ key: 'members', value: course.members.toFixed(1) });
  return out;
}

/** A post with a course (or any hole-tagged slide, or a review) has the row on every slide; otherwise none. */
export function postHasStatRow(p: { hasCourse: boolean; anyHoleTag: boolean; isReview: boolean }): boolean {
  return p.hasCourse || p.anyHoleTag || p.isReview;
}

/** A course-photo kicker ("The fourth", "The 4th") back to its hole number; place kickers give null. */
export function kickerHoleNo(kicker: string | null | undefined): number | null {
  const k = (kicker ?? '').trim().toLowerCase();
  const m = /^the ([1-9]\d*)(st|nd|rd|th)$/.exec(k);
  if (m) return Number(m[1]);
  for (let n = 1; n <= 18; n++) if (k === `the ${holeOrdinal(n)}`) return n;
  return null;
}
