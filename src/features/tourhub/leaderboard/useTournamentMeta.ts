/**
 * useTournamentMeta — sr_tournaments metadata for the new Leaderboard tab
 * (masthead + cut sentence). Never-silent: errors are logged with the
 * [leaderboard-v2] tag and returned as null so the tab degrades gracefully.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentMeta {
  id: string;
  name: string | null;
  venue_name: string | null;
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
}

export function useTournamentMeta(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'tournament-meta', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TournamentMeta | null> => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          'id, name, venue_name, venue_city, venue_country, venue_par, venue_yardage, start_date, end_date, current_round, status, cutline, projected_cutline, cut_round',
        )
        .eq('id', tournamentId as string)
        .maybeSingle();

      if (error) {
        console.error('[leaderboard-v2] useTournamentMeta', error);
        return null;
      }
      return (data as TournamentMeta) ?? null;
    },
  });
}
