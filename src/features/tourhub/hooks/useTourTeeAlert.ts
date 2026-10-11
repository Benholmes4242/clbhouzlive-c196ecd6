import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { tourOptimisticToggle } from './tourOptimisticToggle';

export function useTourTeeAlert(tournamentId: string, round: number) {
  const { user } = useSupabaseSession();
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const key = ['tour-tee-alerts', user?.id, tournamentId, round];
  const alert = useQuery({
    queryKey: key, enabled: !!user, staleTime: Infinity, refetchOnMount: false,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tour_tee_alerts').select('tournament_id')
        .eq('user_id', user.id).eq('tournament_id', tournamentId).eq('round', round);
      if (error) throw error;
      return (data ?? []).map((row) => row.tournament_id);
    },
  });
  const preferences = useQuery({
    queryKey: ['tour-tee-alert-preferences', user?.id], enabled: !!user, staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('notification_preferences').select('muted_types').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const toggle = async () => {
    if (!user || pending || !alert.isSuccess) return;
    setPending(true);
    try {
      await tourOptimisticToggle(client, key, tournamentId, async (on) => {
        const result = on
          ? await supabase.from('tour_tee_alerts').insert({ user_id: user.id, tournament_id: tournamentId, round })
          : await supabase.from('tour_tee_alerts').delete().eq('user_id', user.id).eq('tournament_id', tournamentId).eq('round', round);
        if (result.error) throw result.error;
      });
    } finally { setPending(false); }
  };
  return { armed: (alert.data ?? []).includes(tournamentId), toggle, pending,
    disabled: !user || !alert.isSuccess,
    muted: preferences.data?.muted_types?.includes('tee_off') ?? false };
}