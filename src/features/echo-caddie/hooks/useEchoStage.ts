/**
 * BRIEF_ECHO_CADDIE §2 — THE PHOTOGRAPH. This decides whether the design is
 * viable, so it is the first thing built and the first thing reported.
 *
 * RESOLUTION RULE
 *   a. course in context (?course=<id>, or a course Echo resolved) -> that course
 *   b. no course in context                -> THE MEMBER'S MOST PLAYED COURSE,
 *                                             labelled honestly as their home course
 *   c. no rounds anywhere                  -> NO IMAGE AT ALL (the black treatment)
 *
 * RESOLVERS USED — BOTH ALREADY IN THE APP, NO NEW QUERY:
 *   useUserAnalyticsCourses  (`gam_user_courses`)  — the member's courses ordered
 *       by rounds desc, with rounds_count. Index 0 IS the most played course, so
 *       the fallback costs nothing beyond a hook the profile already subscribes to.
 *   useCourseCardData        (`golf_courses.thumbnail_image`) — the app's own
 *       single-course image resolver, 30-minute staleTime, cache key
 *       ['course-card-data', courseId] SHARED with the clubhouse course card. If
 *       the member has seen that course card this session the photograph is free.
 *
 * A FAILED OR SLOW IMAGE IS NOT A STATE THAT GETS DRAWN. imageReady only goes
 * true once the <img> has actually decoded; until then, and forever on error,
 * the caller renders the black treatment.
 */

import { useMemo } from 'react';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseCardData } from '@/components/clubhouse/hooks/useCourseCardData';

export interface EchoStage {
  /** Course whose photograph and figures this surface is about. */
  courseId: string | null;
  courseName: string | null;
  /** The member's rounds at that course. 0 when they have never played it. */
  roundsHere: number;
  /** True when no course was in context and we fell back to the most played. */
  isHomeFallback: boolean;
  /** The member has rounds SOMEWHERE. False => state 9, black, no image. */
  hasAnyRounds: boolean;
  imageUrl: string | null;
  loading: boolean;
  row: UserAnalyticsCourse | null;
  courses: UserAnalyticsCourse[];
}

export function useEchoStage(contextCourseId: string | null): EchoStage {
  const { data: courses, isLoading: coursesLoading } = useUserAnalyticsCourses();

  const rows = courses ?? [];
  const mostPlayed = rows[0] ?? null;
  const contextRow = contextCourseId ? rows.find((r) => r.course_id === contextCourseId) ?? null : null;

  const courseId = contextCourseId ?? mostPlayed?.course_id ?? null;
  const isHomeFallback = !contextCourseId && !!mostPlayed;

  // The app's existing single-course image resolver. Shared cache — see header.
  const { data: card, isLoading: cardLoading } = useCourseCardData(courseId, !!courseId);

  const courseName = contextRow?.course_name ?? (contextCourseId ? null : mostPlayed?.course_name ?? null);

  return useMemo<EchoStage>(
    () => ({
      courseId,
      courseName,
      roundsHere: contextCourseId ? contextRow?.rounds_count ?? 0 : mostPlayed?.rounds_count ?? 0,
      isHomeFallback,
      hasAnyRounds: rows.length > 0,
      imageUrl: card?.thumbnailImage ?? null,
      loading: coursesLoading || (!!courseId && cardLoading),
      row: contextCourseId ? contextRow : mostPlayed,
      courses: rows,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courseId, courseName, contextCourseId, contextRow, mostPlayed, isHomeFallback, rows.length, card?.thumbnailImage, coursesLoading, cardLoading],
  );
}
