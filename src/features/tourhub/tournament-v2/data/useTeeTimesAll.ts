/**
 * useTeeTimesAll — full round-1 tee times for TD1 upcoming state.
 * Returns groups in chronological order with resolved player id/name/country.
 * Empty array = event lacks tee time coverage (sections self-hide).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeeGroupPlayer {
  id: string | null;
  name: string;
  country?: string | null;
  photoUrl?: string | null;
}
export interface TeeGroup {
  teeTime: string;
  startingHole: number;
  players: TeeGroupPlayer[];
}

export function useTeeTimesAll(
  tournamentId: string | null | undefined,
  round: number = 1,
  options?: { enabled?: boolean },
) {
  return useQuery<TeeGroup[]>({
    queryKey: ['tournament-v2', 'tee-times-all', tournamentId, round],
    enabled: !!tournamentId && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from('sr_tee_times')
        .select(`
          tee_time,
          tee_number,
          back_nine,
          players:sr_tee_time_players(
            player:sr_players!sr_tee_time_players_player_id_fkey(
              id, full_name, first_name, last_name, country, country_code, photo_url
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('round_number', round)
        .order('tee_time', { ascending: true });

      if (error) throw error;

      type RawPlayer = {
        id: string;
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        country: string | null;
        country_code: string | null;
        photo_url: string | null;
      };
      type RawRow = {
        tee_time: string;
        tee_number: number | null;
        back_nine: boolean | null;
        players: Array<{ player: RawPlayer | null }> | null;
      };

      return ((data ?? []) as RawRow[])
        .map((row): TeeGroup => ({
          teeTime: row.tee_time,
          startingHole: row.back_nine ? 10 : (row.tee_number ?? 1),
          players: (row.players ?? []).map((tp): TeeGroupPlayer => {
            const p = tp.player;
            if (!p) return { id: null, name: 'TBA' };
            const name = p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
            return {
              id: p.id,
              name,
              country: p.country_code || p.country,
              photoUrl: p.photo_url,
            };
          }),
        }))
        .filter((g) => g.players.length > 0);

    },
  });
}
