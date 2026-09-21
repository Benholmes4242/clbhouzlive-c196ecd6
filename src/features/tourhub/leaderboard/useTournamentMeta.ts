/**
 * useTournamentMeta — sr_tournaments metadata for the new Leaderboard tab
 * (masthead + cut sentence) AND for tournament-v2 (hero + state panels).
 * Errors throw so React Query surfaces isError; consumers gate on it and
 * offer a Retry. TD1 extensions: venue_course_name, purse,
 * defending_champion, timezone, plus season join for
 * tour_code / tour_full_name.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentMeta {
  id: string;
  name: string | null;
  venue_name: string | null;
  venue_course_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  venue_state: string | null;
  golf_course_id: string | null;
  course_sub_country: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  start_date: string | null;
  end_date: string | null;
  current_round: number | null;
  current_round_status: string | null;
  status: string | null;
  cutline: number | null;
  projected_cutline: number | null;
  cut_round: number | null;
  purse: number | null;
  winner_id: string | null;
  /** sr_tournaments.event_type — stroke | team | cup | match. See _shared/eventFormat. */
  event_type: string | null;
  defending_champion: string | null;
  timezone: string | null;
  tour_code: string | null;
  tour_full_name: string | null;
}

interface MetaOptions {
  /**
   * Live tournaments poll: current_round now flips at venue midnight AND
   * again when play starts, and those drive the hero pill, TODAY column and
   * tee-time availability. Scoped here only - global defaults are untouched.
   */
  live?: boolean;
}

export function useTournamentMeta(
  tournamentId: string | null | undefined,
  options: MetaOptions = {},
) {
  const live = options.live === true;
  return useQuery({
    queryKey: ['tourhub', 'tournament-meta', 'v2', tournamentId],
    enabled: !!tournamentId,
    staleTime: live ? 30_000 : 5 * 60_000,
    refetchInterval: live ? 60_000 : false,
    refetchOnWindowFocus: live,
    queryFn: async (): Promise<TournamentMeta | null> => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          'id, name, venue_name, venue_course_name, venue_city, venue_country, venue_state, golf_course_id, venue_par, venue_yardage, start_date, end_date, current_round, current_round_status, status, cutline, projected_cutline, cut_round, purse, winner_id, event_type, defending_champion, timezone, course:golf_courses!sr_tournaments_golf_course_id_fkey(sub_country), season:sr_seasons!sr_tournaments_season_id_fkey(tour_name, tour_full_name)',
        )
        .eq('id', tournamentId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      type SeasonJoin = { tour_name: string | null; tour_full_name: string | null } | null;
      type CourseJoin = { sub_country: string | null } | null;
      const row = data as Omit<TournamentMeta, 'tour_code' | 'tour_full_name' | 'course_sub_country'> & {
        season?: SeasonJoin | SeasonJoin[];
        course?: CourseJoin | CourseJoin[];
      };
      const seasonRaw = row.season;
      const season: SeasonJoin = Array.isArray(seasonRaw) ? seasonRaw[0] ?? null : seasonRaw ?? null;
      const courseRaw = row.course;
      const course: CourseJoin = Array.isArray(courseRaw) ? courseRaw[0] ?? null : courseRaw ?? null;
      const { season: _season, course: _course, ...rest } = row;
      return {
        ...rest,
        course_sub_country: course?.sub_country ?? null,
        tour_code: season?.tour_name ?? null,
        tour_full_name: season?.tour_full_name ?? null,
      };

    },
  });
}
