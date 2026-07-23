import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SeasonResultsSummary {
  wins: number;
  top10s: number;
  starts: number;
}

/**
 * Season-derived Wins / Top 10s for any tour (LPGA, EURO, PGAD, LIV, PGA).
 *
 * We don't rely on `sr_player_statistics` — that table is only populated for
 * PGA. Instead we count finish positions in `sr_leaderboards` for tournaments
 * whose start_date falls in the given year.
 *
 * A tournament counts as a "start" only if the status is not cut/WD/DQ AND a
 * numeric position is present. Wins = position === 1; Top 10s = position <= 10.
 */
export function useSeasonResultsSummary(
  playerId: string | undefined,
  year: number | undefined,
) {
  return useQuery({
    queryKey: ['tourhub', 'season-results-summary', playerId, year],
    queryFn: async (): Promise<SeasonResultsSummary> => {
      if (!playerId || !year) return { wins: 0, top10s: 0, starts: 0 };

      const yearStart = `${year}-01-01`;
      const yearEnd = `${year + 1}-01-01`;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          `position, status, tournament:sr_tournaments!inner(start_date)`,
        )
        .eq('player_id', playerId)
        .gte('tournament.start_date', yearStart)
        .lt('tournament.start_date', yearEnd)
        .limit(500);

      if (error) throw error;

      let wins = 0;
      let top10s = 0;
      let starts = 0;

      for (const row of data ?? []) {
        const status = (row as { status: string | null }).status;
        const position = (row as { position: number | null }).position;
        if (status === 'cut' || status === 'MC' || status === 'WD' || status === 'DQ') continue;
        if (position === null) continue;
        starts++;
        if (position === 1) wins++;
        if (position <= 10) top10s++;
      }

      return { wins, top10s, starts };
    },
    enabled: !!playerId && !!year,
    staleTime: 5 * 60 * 1000,
  });
}
