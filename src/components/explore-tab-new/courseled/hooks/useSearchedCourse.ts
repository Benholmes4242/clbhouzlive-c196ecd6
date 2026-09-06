import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { DEFAULT_FILTERS } from '../boardFilters';
import { boardCoursesArgs, type BoardCourseRow } from './useBoardCourses';

/**
 * BRIEF_SCORES_REFINEMENTS S2/S3 — A COURSE THE BOARD DOES NOT LIST.
 *
 * The search itself is the EXISTING full-catalogue search (useCourseSearch);
 * this hook only answers the two questions the analytics section then asks of a
 * picked course:
 *
 *   1. WHAT IS IT — name, area and photograph, straight from golf_courses, so
 *      every state can confirm the search found the right place (S3.3).
 *   2. HAS ANYONE PLAYED IT — the SAME get_board_courses RPC the board reads,
 *      pinned to that one course, all time. NO NEW SQL. A course with no rounds
 *      returns no row, which is the no-rounds state, never a zero-filled row.
 *
 * All time deliberately: the section answers "how does Woburn play", and a
 * fourteen-day window would report a course as unplayed because nobody played it
 * this fortnight.
 */
export interface SearchedCourse {
  courseId: string;
  name: string | null;
  area: string | null;
  thumbnail: string | null;
  /** NULL when no round in the circuit has ever been logged there. */
  row: BoardCourseRow | null;
  /** Same course constrained by the currently applied Scores filters. */
  filteredRow: BoardCourseRow | null;
}

export function useSearchedCourse(viewerId: string | undefined, courseId: string | null, filters = DEFAULT_FILTERS) {
  return useQuery<SearchedCourse | null>({
    queryKey: [
      'discover',
      'searched-course',
      courseId,
      viewerId ?? null,
      filters.scope,
      filters.window,
      filters.regionKind,
      filters.regionValue,
      filters.band,
      filters.competition,
    ],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async () => {
      const id = courseId as string;

      const [record, agg, filteredAgg] = await Promise.all([
        supabase
          .from('golf_courses')
          .select('id, name, region, sub_country, thumbnail_image')
          .eq('id', id)
          .maybeSingle(),
        supabase.rpc('get_board_courses' as never, {
          ...boardCoursesArgs(viewerId, {
            ...DEFAULT_FILTERS,
            window: 'all',
            courses: 'one',
            courseId: id,
          }),
          p_limit: 1,
          p_sort: 'played',
        } as never),
        supabase.rpc('get_board_courses' as never, {
          ...boardCoursesArgs(viewerId, { ...filters, courses: 'one', courseId: id }),
          p_limit: 1,
          p_sort: 'played',
        } as never),
      ]);

      if (record.error) throw record.error;

      const c = record.data as
        | { id: string; name: string | null; region: string | null; sub_country: string | null; thumbnail_image: string | null }
        | null;
      if (!c) return null;

      const toRow = (first: Record<string, unknown> | undefined): BoardCourseRow | null => first
        ? {
            course_id: String(first.course_id),
            name: (first.name as string | null) ?? c.name,
            area: (first.area as string | null) ?? null,
            thumbnail_image: (first.thumbnail_image as string | null) ?? c.thumbnail_image,
            rounds: Number(first.rounds ?? 0),
            members: Number(first.members ?? 0),
            plays_to: first.plays_to == null ? null : Number(first.plays_to),
            low_gross: first.low_gross == null ? null : Number(first.low_gross),
            low_to_par: first.low_to_par == null ? null : Number(first.low_to_par),
            low_by: (first.low_by as string | null) ?? null,
            eagle_rounds: Number(first.eagle_rounds ?? 0),
            prev_rounds: first.prev_rounds == null ? null : Number(first.prev_rounds),
            is_new: first.is_new === true,
            total_courses: Number(first.total_courses ?? 0),
            rating: first.rating == null ? null : Number(first.rating),
            rating_count: Number(first.rating_count ?? 0),
          }
        : null;
      const raw = ((agg.data ?? []) as unknown) as Array<Record<string, unknown>>;
      const filteredRaw = ((filteredAgg.data ?? []) as unknown) as Array<Record<string, unknown>>;
      const row = toRow(raw[0]);
      const filteredRow = toRow(filteredRaw[0]);

      return {
        courseId: id,
        name: c.name,
        area: c.region ?? c.sub_country ?? null,
        thumbnail: c.thumbnail_image,
        row,
        filteredRow,
      };
    },
  });
}
