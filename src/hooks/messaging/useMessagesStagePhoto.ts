/**
 * BRIEF_MESSAGES_ECHO_PALETTE §2.6 — the photograph sits BEHIND THE HEADER ONLY.
 * It never runs behind the rows, because rows carry small type and a photograph
 * under twelve of them is noise, not context.
 *
 * RESOLVER, AND WHAT IT COSTS (reported because the brief asks):
 *   1. A course the two of you have played together (thread header) — resolved
 *      by matching the shared round's course NAME against `gam_user_courses`,
 *      which the member already has loaded for Analytics/Echo.
 *   2. Otherwise the member's MOST PLAYED course — `gam_user_courses` row 0.
 *   3. No rounds anywhere — NO IMAGE. The near-black surface is the fallback,
 *      never a grey placeholder.
 *
 * Zero new network calls: `gam_user_courses` (60s staleTime) and
 * `useCourseCardData` (30min staleTime, cache key SHARED with the clubhouse
 * course card) are both already subscribed elsewhere in the app.
 *
 * WHY NAME MATCHING: shared rounds come back with a whs_courses id, which is not
 * a golf_courses id, and the bridge table is not exposed to the client. The name
 * is what both sides agree on. A miss falls through to the most-played course,
 * which is still an honest photograph of the member's golf.
 */

import { useMemo } from 'react';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseCardData } from '@/components/clubhouse/hooks/useCourseCardData';

export interface MessagesStagePhoto {
  imageUrl: string | null;
  courseId: string | null;
  courseName: string | null;
  /** False => draw the black surface, not a placeholder. */
  hasAnyRounds: boolean;
}

function normalise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function useMessagesStagePhoto(
  preferredCourseName?: string | null,
): MessagesStagePhoto {
  const { data: courses } = useUserAnalyticsCourses();
  const rows = courses ?? [];

  const match = useMemo(() => {
    if (!preferredCourseName) return null;
    const target = normalise(preferredCourseName);
    return (
      rows.find((r) => normalise(r.course_name) === target) ??
      rows.find(
        (r) =>
          normalise(r.course_name).includes(target) ||
          target.includes(normalise(r.course_name)),
      ) ??
      null
    );
  }, [rows, preferredCourseName]);

  const chosen = match ?? rows[0] ?? null;
  const { data: card } = useCourseCardData(chosen?.course_id ?? null, !!chosen);

  return useMemo(
    () => ({
      imageUrl: card?.thumbnailImage ?? null,
      courseId: chosen?.course_id ?? null,
      courseName: chosen?.course_name ?? null,
      hasAnyRounds: rows.length > 0,
    }),
    [card?.thumbnailImage, chosen?.course_id, chosen?.course_name, rows.length],
  );
}
