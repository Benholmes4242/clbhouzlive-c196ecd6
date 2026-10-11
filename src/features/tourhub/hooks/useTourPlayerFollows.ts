import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { tourOptimisticToggle } from './tourOptimisticToggle';

const pending = new Set<string>();

export function useTourPlayerFollows(enabled = true) {
  const { user } = useSupabaseSession();
  const client = useQueryClient();
  const key = ['tour-player-follows', user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: enabled && !!user,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tour_player_follows').select('player_id').eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((row) => row.player_id);
    },
  });
  const playerIds = useMemo(() => new Set(query.data ?? []), [query.data]);
  const toggle = async (playerId: string) => {
    if (!user || !query.isSuccess) return;
    const lock = `${user.id}:${playerId}`;
    if (pending.has(lock)) return;
    pending.add(lock);
    try {
      await tourOptimisticToggle(client, key, playerId, async (on) => {
        const result = on
          ? await supabase.from('tour_player_follows').insert({ user_id: user.id, player_id: playerId })
          : await supabase.from('tour_player_follows').delete().eq('user_id', user.id).eq('player_id', playerId);
        if (result.error) throw result.error;
      });
    } finally {
      pending.delete(lock);
    }
  };
  return { playerIds, toggle, signedIn: !!user, isLoading: query.isLoading, error: query.error };
}