/**
 * pickCourse — THE ONE most-played-course resolver for the handicap tab
 * (BRIEF_HANDICAP_TAB_REBUILD phase 1.6, J2).
 *
 * Moved out of NextRoundSection.tsx unchanged when that section was cut:
 * four sections (AgeingOut, Holes, Floor, PersonalBests) still need it.
 * Behaviour is exactly as before — walk the window for the most-played
 * course_id and take that course's most recent round's ratings, skipping
 * any course missing either a course rating or a slope rating.
 */
import type { WhsScore } from './types';

/**
 * Most-played course in the window (ties -> most recent round), using that
 * course's most recent round's ratings. Falls to the next course when the
 * ratings are missing; null when none has both.
 */
export function pickCourse(window: WhsScore[]) {
  const order: string[] = [];
  const count = new Map<string, number>();
  for (const r of window) {
    if (!r.course_id) continue;
    if (!count.has(r.course_id)) order.push(r.course_id);
    count.set(r.course_id, (count.get(r.course_id) ?? 0) + 1);
  }
  // `order` is first appearance in a newest-first list = most recent; stable sort keeps it as tie-break.
  const ranked = [...order].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0));
  for (const id of ranked) {
    const latest = window.find((r) => r.course_id === id)!;
    if (latest.course_rating != null && latest.slope_rating) {
      return { id, name: latest.course?.name ?? '', cr: latest.course_rating, slope: latest.slope_rating };
    }
  }
  return null;
}
