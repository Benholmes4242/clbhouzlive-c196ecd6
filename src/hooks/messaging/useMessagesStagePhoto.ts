/**
 * BRIEF_MESSAGES_DARK §2.2 — THE IMAGE IS INFORMATION OR IT IS ABSENT.
 *
 * WITHDRAWN FROM BRIEF_MESSAGES_ECHO_PALETTE §2.6: the most-played-course
 * fallback, and the photograph on the inbox header. A picture of the member's
 * own club behind a thread with someone they have never played is atmosphere,
 * not information, so there is NO FALLBACK LEFT.
 *
 * WHAT REMAINS: a thread carries a photograph ONLY when there is a REAL SHARED
 * COURSE — the venue the two of you actually played. Everything else gets the
 * plain dark header.
 *
 * Zero new network calls: `gam_user_courses` (60s staleTime) and
 * `useCourseCardData` (30min staleTime, cache key SHARED with the clubhouse
 * course card) are both already subscribed elsewhere in the app.
 *
 * WHY NAME MATCHING: shared rounds come back with a whs_courses id, which is not
 * a golf_courses id, and the bridge table is not exposed to the client. The name
 * is what both sides agree on. A MISS DRAWS NO PHOTOGRAPH — it does not fall
 * through to another course.
 */

import { useMemo } from 'react';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseCardData } from '@/components/clubhouse/hooks/useCourseCardData';

export interface MessagesStagePhoto {
  imageUrl: string | null;
  courseId: string | null;
  courseName: string | null;
}

function normalise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * @param sharedCourseName the course the two members actually played together.
 *   Null/absent => no photograph, by design.
 */
export function useMessagesStagePhoto(
  sharedCourseName?: string | null,
): MessagesStagePhoto {
  const { data: courses } = useUserAnalyticsCourses();
  const rows = courses ?? [];

  const chosen = useMemo(() => {
    if (!sharedCourseName) return null;
    const target = normalise(sharedCourseName);
    return (
      rows.find((r) => normalise(r.course_name) === target) ??
      rows.find(
        (r) =>
          normalise(r.course_name).includes(target) ||
          target.includes(normalise(r.course_name)),
      ) ??
      null
    );
  }, [rows, sharedCourseName]);

  const { data: card } = useCourseCardData(chosen?.course_id ?? null, !!chosen);

  return useMemo(
    () => ({
      imageUrl: chosen ? card?.thumbnailImage ?? null : null,
      courseId: chosen?.course_id ?? null,
      courseName: chosen?.course_name ?? null,
    }),
    [card?.thumbnailImage, chosen],
  );
}
