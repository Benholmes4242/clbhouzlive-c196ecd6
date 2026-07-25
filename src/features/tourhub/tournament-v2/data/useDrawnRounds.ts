/**
 * useDrawnRounds - which rounds actually have tee-time rows for a tournament.
 *
 * Round availability must come from the data, not from current_round: a draw
 * is published hours before the round rolls over at venue-local midnight.
 * Returns a sorted, de-duplicated array of round numbers (1-4).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDrawnRounds(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'tee-times', 'drawn-rounds', tournamentId],
    enabled: !!tournamentId,
    staleTime: 60_000,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from('sr_tee_times')
        .select('round_number')
        .eq('tournament_id', tournamentId as string)
        .limit(1000);

      if (error) throw error;
      const set = new Set<number>();
      for (const row of (data ?? []) as Array<{ round_number: number | null }>) {
        const n = Number(row.round_number);
        if (Number.isFinite(n) && n >= 1 && n <= 4) set.add(n);
      }
      return [...set].sort((a, b) => a - b);
    },
  });
}
