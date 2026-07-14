/**
 * useTournamentHoleAnalysis — RPC-backed hole analysis for the tournament
 * "All 18 Holes" sheet. Delegates to get_tournament_hole_analysis(uuid);
 * shape mirrors get_course_hole_analysis so SharedHoleCard can consume it
 * source-agnostically. Note: `rounds` here means distinct PLAYERS on the
 * hole (the surface labels it accordingly via countLabel="players").
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentHoleDistribution {
  ace: number;
  albatross: number;
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  double: number;
}

export interface TournamentHole {
  hole_no: number;
  par: number;
  yards: number | null;
  stroke_index: number | null; // always null for tournaments
  rounds: number;              // distinct players on the hole
  avg_to_par: number;
  avg_gross: number;
  dist: TournamentHoleDistribution;
}

export interface TournamentHoleAnalysis {
  available: boolean;
  total_players: number;
  holes: TournamentHole[];
}

export function useTournamentHoleAnalysis(tournamentId: string | null | undefined) {
  return useQuery<TournamentHoleAnalysis>({
    queryKey: ['tournament-v2', 'hole-analysis', tournamentId],
    enabled: !!tournamentId,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_tournament_hole_analysis', {
        p_tournament_id: tournamentId,
      });
      if (error) throw error;
      return (data ?? { available: false, total_players: 0, holes: [] }) as TournamentHoleAnalysis;
    },
  });
}
