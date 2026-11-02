/** useFieldForm — Map<player_id, Start[]> (oldest → newest, max five) from get_tour_field_form. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { currentSeasonYear } from '../../_shared/stats/useLeaderCategories';
import { parseStarts, type Start } from '../playersRules';
import type { PlayersTourId } from './usePlayersRanking';

export function useFieldForm(tour: PlayersTourId, seasonYear?: number) {
  const year = seasonYear ?? currentSeasonYear();
  return useQuery<Map<string, Start[]>>({
    queryKey: ['players-v2', 'form', tour, year],
    enabled: seasonYear !== undefined,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tour_field_form', { p_tour: tour, p_year: year });
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.player_id, parseStarts(r.starts)]));
    },
  });
}
