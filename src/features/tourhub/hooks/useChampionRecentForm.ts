/**
 * useChampionRecentForm — aggregates the world #1 player's tournament finishes
 * over the last N weeks. Used by the Players hero "Recent Form" pill.
 *
 * Returns starts, wins, and top-10 counts. Pill consumer should only render
 * when starts ≥ 3.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChampionRecentForm {
  starts: number;
  wins: number;
  top10s: number;
}

export function useChampionRecentForm(
  championPlayerId: string | null | undefined,
  weeks: number = 8,
) {
  return useQuery({
    queryKey: ['tourhub', 'champion-recent-form', championPlayerId, weeks],
    enabled: !!championPlayerId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ChampionRecentForm> => {
      if (!championPlayerId) return { starts: 0, wins: 0, top10s: 0 };

      const cutoffIso = new Date(
        Date.now() - weeks * 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          position,
          status,
          tournament:sr_tournaments!inner(end_date)
        `)
        .eq('player_id', championPlayerId)
        .gte('tournament.end_date', cutoffIso);

      if (error || !data) return { starts: 0, wins: 0, top10s: 0 };

      let starts = 0;
      let wins = 0;
      let top10s = 0;

      for (const row of data) {
        // Count any row with a tournament join as a start (player teed it up).
        // Withdrawals / cuts still count as starts; only DQ-with-no-position is omitted.
        if (!row.tournament) continue;
        starts += 1;
        const pos = row.position;
        if (typeof pos === 'number') {
          if (pos === 1) wins += 1;
          if (pos <= 10) top10s += 1;
        }
      }

      return { starts, wins, top10s };
    },
  });
}
