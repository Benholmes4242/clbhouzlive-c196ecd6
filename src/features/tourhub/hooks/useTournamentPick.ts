/** Tournament pick reads stay RPC-only and viewer-keyed. Mutations refetch active
 * state explicitly; field ordering and lock authority belong to the server.
 * Guest availability uses only the public scalar lock RPCs, never member state. */
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
  my_player_name?: string | null;
  my_position?: number | null;
  my_tied?: boolean;
  my_score?: number | null;
  my_status?: string | null;
  my_thru?: number | null;
  my_percentile?: number | null;
  my_still_in_field?: boolean;
  followed_best?: { player_id?: string; player_name: string; position: number; tied?: boolean } | null;
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
      return { ...row, followed_best: row.followed_best as unknown as TournamentPickState['followed_best'], followed_top };
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

export function useGuestTournamentPickLock(tournamentId: string, enabled = true) {
  const { user } = useSupabaseSession();
  const guest = !user || user.is_anonymous || Boolean(getGuestUser());
  return useQuery({
    queryKey: ['tourhub', 'guest-pick-lock', tournamentId, user?.id],
    enabled: Boolean(tournamentId && guest && enabled),
    staleTime: 0, refetchOnMount: 'always',
    queryFn: async (): Promise<{ locks_at: string | null; locked: boolean }> => {
      const [time, lock] = await Promise.all([
        supabase.rpc('tournament_pick_locks_at', { p_tournament_id: tournamentId }),
        supabase.rpc('tournament_pick_is_locked', { p_tournament_id: tournamentId }),
      ]);
      if (time.error) throw time.error;
      if (lock.error) throw lock.error;
      return { locks_at: typeof time.data === 'string' ? time.data : null, locked: lock.data === true };
    },
  });
}