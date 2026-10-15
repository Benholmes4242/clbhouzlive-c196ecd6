/**
 * COURSE-LEGACY SUMMARY — courses played and countries played.
 *
 * THE 49 (BRIEF_PROFILE_PASS_ONE §D — the basis line).
 * COUNTS: rows in `user_course_activity` for the member, one per course. A row
 * lands there when the member DID SOMETHING AT A COURSE — played it, rated it,
 * marked it — so it includes courses with NO IMPORTED ROUND and courses that
 * were never mapped to a WHS score. It is the member's course legacy, not their
 * round history. Measured 10 Sep 2026: 49.
 *
 * IT IS NOT THE 35. That is a DIFFERENT QUESTION asked of different data:
 * courses the member has IMPORTED ROUNDS AT, from `gam_user_courses()` (see
 * useUserAnalyticsCourses). 49 minus 35 is not "14 missing courses" — it is 14
 * courses with activity and no imported round, which is a normal state and not a
 * gap to close. Neither figure is a subset the other can be derived from: a
 * mapped round at a course with no activity row would sit in 35 and not in 49.
 *
 * The countries figure is counted from the SAME 49 rows, so it is the legacy
 * question too, never the imported-round one.
 *
 * THREE STATES, NEVER A CONFIDENT ZERO. Both counts previously defaulted to 0,
 * so a failed read rendered "PLAYED 0" — a member with fifty courses told they
 * had none. Now a failed or unrun read returns null and the consumer renders the
 * label without a figure.
 *
 * THE GATE IS `isFetched`, NOT `isLoading`. A disabled React Query v5 query is
 * pending with `fetchStatus: 'idle'`, so `isLoading` is false before it has ever
 * run; gating on it renders a placeholder that never resolves.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';

export interface CountryRow {
  id: string;
  sub_country: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** The course's club, embedded in the same read (golf_courses.club_id). */
  golf_clubs?: { latitude: number | null; longitude: number | null } | null;
}
export interface CountryTally { country: string; courses: number }
export interface CoursePoint { id: string; lat: number; lng: number }
export interface CountriesSummary {
  count: number;
  tallies: CountryTally[];
  /** Courses with both coordinates; the rest still count everywhere else. */
  points: CoursePoint[];
  /** Courses that still cannot be plotted after the club fallback. */
  unmapped: number;
  /** Course name by id, from the same golf_courses read (share card labels). */
  names: Record<string, string>;
}
const EMPTY_COUNTRIES: CountriesSummary = { count: 0, tallies: [], points: [], unmapped: 0, names: {} };

/** Null and empty sub_country never become a counted country. */
export function summariseCountries(rows: CountryRow[]): CountriesSummary {
  const m = new Map<string, number>();
  const points: CoursePoint[] = [];
  let unmapped = 0;
  const names: Record<string, string> = {};
  for (const r of rows) {
    if (r.name) names[r.id] = r.name;
    const c = r.sub_country?.trim();
    if (c) m.set(c, (m.get(c) ?? 0) + 1);
    // A course with no coordinates of its own borrows its club's. Whatever still cannot be plotted is stated in the legend — a map that silently drops a quarter of a member's golf while the figure above says 53 is a map that lies.
    const own = r.latitude != null && r.longitude != null;
    const club = r.golf_clubs;
    const lat = own ? r.latitude : club?.latitude;
    const lng = own ? r.longitude : club?.longitude;
    if (lat != null && lng != null) {
      points.push({ id: r.id, lat: Number(lat), lng: Number(lng) });
    } else {
      unmapped += 1;
    }
  }
  const tallies = [...m.entries()]
    .map(([country, courses]) => ({ country, courses }))
    .sort((a, b) => b.courses - a.courses || a.country.localeCompare(b.country));
  return { count: tallies.length, tallies, points, unmapped, names };
}

export function useUserCourseSummary(userId: string | undefined) {
  const enabled = !!userId;

  const coursesQuery = useQuery({
    queryKey: ['user-courses-played-count', userId],
    enabled,
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('user_course_activity' as any)
        .select('course_id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const countriesQuery = useQuery({
    queryKey: ['user-countries-played-summary', userId],
    enabled,
    queryFn: async () => {
      if (!userId) return EMPTY_COUNTRIES;

      const { data: activities, error: actError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (actError) throw actError;

      const courseIds = (activities || []).map((a: any) => a.course_id);
      if (courseIds.length === 0) return EMPTY_COUNTRIES;

      // golf_courses.country is a REGION grouping ('Britain & Ireland', 'Continental Europe', 'Middle East'), NOT a country. The country is sub_country. Reading .country here is what made this panel report 3 countries for a member who has played in 9. The ~20 files under src/components/courses/ that display a location already use sub_country — this hook is following that convention, not inventing one. Do not 'simplify' this back to .country.
      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, name, sub_country, latitude, longitude, golf_clubs(latitude, longitude)')
        .in('id', courseIds);

      if (courseError) throw courseError;

      return summariseCountries((courses || []) as CountryRow[]);
    },
    staleTime: 60_000,
  });

  // Reuse the optimized Top 100 progress hook
  const { data: progressData, isFetched: progressFetched } = useTop100ProgressForUser(userId);
  const top100Progress = progressData?.lists || [];

  const coursesKnown = coursesQuery.isFetched && !coursesQuery.isError;
  const countriesKnown = countriesQuery.isFetched && !countriesQuery.isError;

  return {
    /** Null means unknown (unrun or failed read), never "zero courses". */
    totalCoursesPlayed: coursesKnown ? coursesQuery.data ?? null : null,
    countriesPlayed: countriesKnown ? countriesQuery.data?.count ?? null : null,
    /** Per-country tallies (sub_country), descending. Null when unknown. */
    countryTallies: countriesKnown ? countriesQuery.data?.tallies ?? null : null,
    coursePoints: countriesKnown ? countriesQuery.data?.points ?? null : null,
    unmappedCount: countriesKnown ? countriesQuery.data?.unmapped ?? 0 : 0,
    top100Progress,
    /** True only while a read is genuinely in flight; an error ends loading. */
    isLoading:
      enabled &&
      (!coursesQuery.isFetched || !countriesQuery.isFetched || !progressFetched),
    isCoursesError: coursesQuery.isError,
    isCountriesError: countriesQuery.isError,
  };
}
