/** Field read only; server ordering remains authoritative for tournament tees. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PickFieldPlayer {
  player_id: string;
  full_name: string;
  country: string | null;
  world_rank: number | null;
  photo_url: string | null;
  headshot_override: string | null;
}
const pickFieldKey = (id: string) => ['tourhub', 'pick-field', id] as const;

export function usePickField(tournamentId: string) {
  return useQuery({
    queryKey: pickFieldKey(tournamentId), enabled: Boolean(tournamentId),
    staleTime: 60_000, refetchOnMount: 'always',
    queryFn: async (): Promise<PickFieldPlayer[]> => {
      const { data, error } = await supabase.rpc('get_pick_field', { p_tournament_id: tournamentId });
      if (error) throw error;
      return data ?? [];
    },
  });
}

