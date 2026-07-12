/**
 * useTournamentMeta — sr_tournaments metadata for the new Leaderboard tab
 * (masthead + cut sentence) AND for tournament-v2 (hero + state panels).
 * Never-silent: errors are logged with the [leaderboard-v2] tag and
 * returned as null so consumers degrade gracefully.
 *
 * TD1 extensions: venue_course_name, purse, defending_champion, timezone,
 * plus season join for tour_code / tour_full_name.
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
  venue_par: number | null;
  venue_yardage: number | null;
  start_date: string | null;
  end_date: string | null;
  current_round: number | null;
  status: string | null;
  cutline: number | null;
  projected_cutline: number | null;
  cut_round: number | null;
  purse: number | null;
  defending_champion: string | null;
  timezone: string | null;
  tour_code: string | null;
  tour_full_name: string | null;
}

export function useTournamentMeta(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'tournament-meta', 'v2', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TournamentMeta | null> => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          'id, name, venue_name, venue_course_name, venue_city, venue_country, venue_par, venue_yardage, start_date, end_date, current_round, status, cutline, projected_cutline, cut_round, purse, defending_champion, timezone, season:sr_seasons!sr_tournaments_season_id_fkey(tour_name, tour_full_name)',
        )
        .eq('id', tournamentId as string)
        .maybeSingle();

      if (error) {
        console.error('[leaderboard-v2] useTournamentMeta', error);
        return null;
      }
      if (!data) return null;
      const season: any = (data as any).season;
      return {
        ...(data as any),
        tour_code: season?.tour_name ?? null,
        tour_full_name: season?.tour_full_name ?? null,
      } as TournamentMeta;
    },
  });
}
