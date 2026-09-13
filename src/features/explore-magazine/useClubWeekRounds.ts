import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { boardRpcArgs, type BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';

/**
 * "THIS WEEK AT {CLUB}" IS ROUNDS PLAYED AT THE CLUB'S COURSES.
 *
 * WHY THIS HOOK EXISTS INSTEAD OF p_scope='club'. In the deployed board_pool,
 * p_scope='club' filters by the CLUB'S MEMBERS
 * (user_profiles.primary_club_id = the viewer's club), NOT by the club's
 * courses. The name reads one way and means another — the same shape as the
 * board_pool region finding. The members-anywhere set is the PEOPLE shelf's
 * subject, not this one.
 *
 * THE ONLY COURSE PREDICATE THE DEPLOYED RPC HAS is p_courses='one' with a
 * single p_course_id. A club can hold up to three courses (170 clubs hold more
 * than one; Sundridge Park holds East and West), so this hook fans out ONE
 * course-scoped call per course of the club and merges the results by date.
 * Nothing is fetched that is then thrown away: every returned row is a round at
 * one of the club's courses.
 *
 * THE POOL COUNT. Each call's pool_rounds counts qualifying rounds AT THAT
 * COURSE in the window. The per-course sets are disjoint, so the sum is exactly
 * the set the tiles are drawn from — rounds at the club's courses in the window.
 */

export interface ClubWeekRow extends BoardRow {
  /** The distinguishing course label, e.g. "West Course". Null for a one-course club. */
  course_label: string | null;
}

export interface ClubWeekResult {
  rows: ClubWeekRow[];
  /** Rounds at the club's courses inside the window, summed over its courses. */
  poolRounds: number;
  /** How many courses the club holds — the tile names the course only when > 1. */
  courseCount: number;
}

/** "Sundridge Park (West Course)" -> "West Course"; else the club prefix is stripped. */
export function courseLabel(courseName: string | null, clubName: string | null): string | null {
  if (!courseName) return null;
  const paren = courseName.match(/\(([^)]+)\)\s*$/);
  if (paren) return paren[1].trim();
  if (clubName && courseName.toLowerCase().startsWith(clubName.toLowerCase())) {
    const rest = courseName.slice(clubName.length).replace(/^[\s\-–—:,]+/, '').trim();
    if (rest) return rest;
  }
  return courseName;
}

export function useClubWeekRounds(
  viewerId: string | undefined,
  clubId: string | null,
  clubName: string | null,
  enabled: boolean,
  limit = 12,
) {
  const on = enabled && !!viewerId && !!clubId;

  const query = useQuery<ClubWeekResult>({
    queryKey: ['explore-magazine', 'club-week-rounds', viewerId ?? 'anon', clubId ?? 'none', limit],
    enabled: on,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: courses, error: coursesError } = await supabase
        .from('golf_courses')
        .select('id, name')
        .eq('club_id', clubId as string);
      if (coursesError) throw coursesError;
      const list = courses ?? [];
      if (list.length === 0) return { rows: [], poolRounds: 0, courseCount: 0 };

      const pages = await Promise.all(
        list.map(async (course) => {
          const args = boardRpcArgs(viewerId, 'recent', {
            ...DEFAULT_FILTERS,
            scope: 'everyone',
            window: '14',
            courses: 'one',
            courseId: course.id,
          });
          const { data, error } = await supabase.rpc('get_board_page' as never, {
            ...args,
            p_limit: limit,
            p_offset: 0,
          } as never);
          if (error) throw error;
          const rows = ((data ?? []) as unknown) as BoardRow[];
          return {
            rows: rows.map((row) => ({
              ...row,
              course_label:
                list.length > 1 ? courseLabel(row.course_name ?? course.name, clubName) : null,
            })),
            poolRounds: rows[0] ? Number(rows[0].pool_rounds) : 0,
          };
        }),
      );

      const merged = pages
        .flatMap((page) => page.rows)
        .sort((a, b) => (a.play_date < b.play_date ? 1 : a.play_date > b.play_date ? -1 : 0))
        .slice(0, limit);

      return {
        rows: merged,
        poolRounds: pages.reduce((sum, page) => sum + page.poolRounds, 0),
        courseCount: list.length,
      };
    },
  });

  return {
    rows: query.data?.rows ?? [],
    poolRounds: query.data?.poolRounds ?? 0,
    courseCount: query.data?.courseCount ?? 0,
    isFetched: on ? query.isFetched : true,
    error: query.error,
  };
}
