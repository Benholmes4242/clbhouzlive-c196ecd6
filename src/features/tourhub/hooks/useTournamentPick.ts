/** Tournament pick reads stay RPC-only and viewer-keyed. Mutations refetch active
 * state explicitly; field ordering and lock authority belong to the server. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getGuestUser } from '@/features/guest/guestGateStore';

export interface PickFieldPlayer {
  player_id: string;
  full_name: string;
  country: string | null;
  world_rank: number | null;
  photo_url: string | null;
  headshot_override: string | null;
}
export interface FollowedPick { player_id: string; player_name: string; picks: number }
export interface TournamentPickState {
  my_player_id: string | null;
  locks_at: string | null;
  locked: boolean;
  followed_pickers: number;
  followed_top: FollowedPick[];
}
export const pickFieldKey = (id: string) => ['tourhub', 'pick-field', id] as const;
export const tournamentPickStateKey = (id: string, userId?: string) => ['tourhub', 'tournament-pick-state', id, userId] as const;

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

export function useTournamentPickState(tournamentId: string) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: tournamentPickStateKey(tournamentId, user?.id),
    enabled: Boolean(tournamentId && user && !user.is_anonymous && !getGuestUser()),
    staleTime: 0, refetchOnMount: 'always',
    queryFn: async (): Promise<TournamentPickState | null> => {
      const { data, error } = await supabase.rpc('get_tournament_pick_state', { p_tournament_id: tournamentId });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      const top = Array.isArray(row.followed_top) ? row.followed_top : [];
      const followed_top = top.flatMap((value): FollowedPick[] => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
        const { player_id, player_name, picks } = value;
        return typeof player_id === 'string' && typeof player_name === 'string' && typeof picks === 'number'
          ? [{ player_id, player_name, picks }] : [];
      }).slice(0, 3);
      return { my_player_id: row.my_player_id, locks_at: row.locks_at, locked: row.locked, followed_pickers: row.followed_pickers, followed_top };
    },
  });
}

export function useSetTournamentPick() {
  const client = useQueryClient();
  const { user } = useSupabaseSession();
  return useMutation({
    mutationFn: async ({ tournamentId, playerId }: { tournamentId: string; playerId: string }) => {
      if (!user || user.is_anonymous || getGuestUser()) throw new Error('Sign in to pick');
      const { data, error } = await supabase.rpc('set_tournament_pick', { p_tournament_id: tournamentId, p_player_id: playerId });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { tournamentId }) => client.invalidateQueries({
      queryKey: tournamentPickStateKey(tournamentId, user?.id), refetchType: 'active',
    }),
  });
}