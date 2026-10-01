/**
 * TOURNAMENT PLACE — one resolver for every surface that prints where an
 * event is played (BRIEF_TOURNAMENT_PLACE_FROM_THE_COURSE).
 *
 * When sr_tournaments.golf_course_id is set, the place is composed from THAT
 * golf_courses row through the shared course helper `coursePlaceLine`, so it
 * reads identically to course surfaces ("Fife, Scotland"). Only an unlinked
 * tournament returns null here, and each surface keeps its existing
 * SportRadar-field fallback (venue_city etc.) exactly as before.
 */
import { coursePlaceLine } from '@/features/explore-magazine/placeLine';

export const TOURNAMENT_COURSE_PLACE_JOIN =
  'course:golf_courses!sr_tournaments_golf_course_id_fkey(region, sub_country, country)';

export type CoursePlaceJoin = { region: string | null; sub_country: string | null; country: string | null } | null;

export function linkedTournamentPlace(
  golfCourseId: string | null | undefined,
  courseRaw: CoursePlaceJoin | CoursePlaceJoin[] | undefined,
): string | null {
  if (!golfCourseId) return null;
  const course = Array.isArray(courseRaw) ? courseRaw[0] ?? null : courseRaw ?? null;
  if (!course) return null;
  return coursePlaceLine({ region: course.region, subCountry: course.sub_country, country: course.country });
}
