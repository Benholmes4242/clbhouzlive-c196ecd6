/**
 * BRIEF_ECHO_CHAT §4 / §5 — the data behind an answer, and NOTHING MORE.
 *
 * There is NO PHOTOGRAPH and NO most-played-course fallback (§2): a course is
 * only in play when the caller arrived with one (`?course=`). If it is absent,
 * nothing is resolved and nothing is claimed.
 *
 * §4.4 EVERY CHART CARRIES ITS SAMPLE, so the basis figures come from the same
 * read as the bars, never from a second source.
 *
 * §5.1 THE SOURCES NAMED MUST BE THE SOURCES ACTUALLY READ. `sources` below is
 * derived from the reads that actually fired for THIS question — never a fixed
 * list. There is no field aggregate in echo_get_*, so "the field's rounds" can
 * never appear.
 */

import { useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyHolePerformance } from '@/hooks/gam/useMyHolePerformance';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import type { HoleDatum } from '../components/HolesBar';

export type EchoKind = 'your_golf' | 'course' | 'game';

export interface CourseBar {
  label: string;
  value: number;
  mine: boolean;
}

export interface EchoAnswerData {
  loading: boolean;
  courseId: string | null;
  courseName: string | null;
  /** Rounds the member has at the in-context course. 0 when none. */
  roundsHere: number;
  /** The member has rounds SOMEWHERE. Drives the no-rounds state. */
  hasAnyRounds: boolean;
  /** §4.2 the member's own hole performance at the in-context course. */
  holes: HoleDatum[];
  /** The hole picked out in white — the one costing the most. */
  worstHole: number | null;
  /** §4.3 course-by-course comparison for a "your golf" answer. */
  courseBars: CourseBar[];
  totalRounds: number;
  courseCount: number;
  /** Only the reads that fired, in resolve order. */
  sources: (id: 'rounds' | 'holes' | 'course' | 'tour') => boolean;
}

export function useEchoAnswerData(
  contextCourseId: string | null,
  kind: EchoKind | null,
  question: string | null,
): EchoAnswerData {
  const { user } = useSupabaseSession();
  const { data: courses = [], isLoading: coursesLoading } = useUserAnalyticsCourses();

  const row = useMemo(
    () => (contextCourseId ? courses.find((c) => c.course_id === contextCourseId) ?? null : null),
    [courses, contextCourseId],
  );

  const roundsHere = row?.rounds_count ?? 0;
  const { data: holeRows = [], isLoading: holesLoading } = useMyHolePerformance(
    user?.id,
    contextCourseId ?? undefined,
    { enabled: !!contextCourseId && roundsHere > 0 },
  );

  const holes = useMemo<HoleDatum[]>(
    () =>
      holeRows
        .filter((h) => h.times_played > 0)
        .map((h) => ({ holeNo: h.hole_no, avgToPar: Number(h.avg_to_par) })),
    [holeRows],
  );

  const worstHole = useMemo(() => {
    if (holes.length === 0) return null;
    return holes.reduce((a, b) => (b.avgToPar > a.avgToPar ? b : a)).holeNo;
  }, [holes]);

  const courseBars = useMemo<CourseBar[]>(() => {
    const withData = courses.filter((c) => c.avg_to_par != null);
    return withData
      .slice()
      .sort((a, b) => b.rounds_count - a.rounds_count)
      .slice(0, 6)
      .map((c) => ({
        label: c.course_name,
        value: Number(c.avg_to_par),
        mine: contextCourseId ? c.course_id === contextCourseId : false,
      }));
  }, [courses, contextCourseId]);

  const totalRounds = useMemo(
    () => courses.reduce((n, c) => n + (c.rounds_count ?? 0), 0),
    [courses],
  );

  const q = (question ?? '').toLowerCase();
  const tourRead =
    kind === 'course' && /\b(tour|tournament|player|open|major|this week|leaderboard|cut)\b/.test(q);

  const sources = (id: 'rounds' | 'holes' | 'course' | 'tour'): boolean => {
    if (kind === 'game') return false; // §5.2 nothing was opened.
    switch (id) {
      case 'rounds':
        return roundsHere > 0;
      case 'holes':
        return holes.length > 0;
      case 'course':
        return !!contextCourseId;
      case 'tour':
        return tourRead;
    }
  };

  return {
    loading: coursesLoading || holesLoading,
    courseId: contextCourseId,
    courseName: row?.course_name ?? null,
    roundsHere,
    hasAnyRounds: courses.length > 0,
    holes,
    worstHole,
    courseBars,
    totalRounds,
    courseCount: courses.length,
    sources,
  };
}
