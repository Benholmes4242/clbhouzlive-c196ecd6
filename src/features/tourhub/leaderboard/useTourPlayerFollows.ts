/** Member identity owns one cached follow list across all boards. Never use
 * a business actor or guest id; optimistic changes roll back on server refusal. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { useGuestActionGate, assertNotGuestWrite } from '@/features/guest/useGuestActionGate';

export async function writeTourPlayerFollow(userId: string, playerId: string, following: boolean) {
  assertNotGuestWrite('follow');
  const result = following
    ? await supabase.from('tour_player_follows').delete().eq('user_id', userId).eq('player_id', playerId)
    : await supabase.from('tour_player_follows').insert({ user_id: userId, player_id: playerId });
  if (result.error) throw result.error;
}
export function useTourPlayerFollows(enabled = true) {
  const { user } = useSupabaseSession();
  const guest = useIsGuest();
  const gate = useGuestActionGate();
  const client = useQueryClient();
  const userId = !guest ? user?.id : undefined;
  const key = ['tour-player-follows', userId];
  const query = useQuery({ queryKey: key, enabled: enabled && !!userId, staleTime: Infinity,
    queryFn: async () => {
      if (!userId) return [] as string[];
      const { data, error } = await supabase.from('tour_player_follows').select('player_id').eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map(row => row.player_id);
    } });
  const mutation = useMutation({
    mutationFn: ({ playerId, following }: { playerId: string; following: boolean }) => userId ? writeTourPlayerFollow(userId, playerId, following) : Promise.reject(new Error('Member required')),
    onMutate: async ({ playerId, following }) => {
      assertNotGuestWrite('follow');
      await client.cancelQueries({ queryKey: key });
      const before = client.getQueryData<string[]>(key) ?? [];
      client.setQueryData(key, following ? before.filter(id => id !== playerId) : [...before, playerId]);
      return { before };
    },
    onError: (_error, _variables, context) => { if (context) client.setQueryData(key, context.before); },
  });
  const ids = new Set(userId && !query.isError ? query.data ?? [] : []);
  return { ids, busy: mutation.isPending, error: mutation.error,
    toggle: (playerId: string) => {
      if (gate('follow') || !userId || mutation.isPending) return;
      mutation.mutate({ playerId, following: ids.has(playerId) });
    } };
}