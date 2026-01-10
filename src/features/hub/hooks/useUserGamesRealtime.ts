import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { hubEvents, type HubEvent } from '@/lib/hubEvents';

export function useUserGamesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    // Supabase Realtime: DB → UI, filtered by user_id to avoid noisy updates
    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel('games-and-participants')
        // Games where user is host
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'games',
          filter: `host_user_id=eq.${user.id}`,
        }, () => {
          qc.invalidateQueries({ queryKey: ['userGames:v2'] });
        })
        // Participants where user is involved
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'game_participants',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          qc.invalidateQueries({ queryKey: ['userGames:v2'] });
        })
        .subscribe();

      return channel;
    };

    let channel: any;
    setupRealtimeListener().then(ch => { channel = ch; });

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [qc]);

  useEffect(() => {
    // Event Bridge: UI → UI (instant local updates)
    const handler = () => qc.invalidateQueries({ queryKey: ['userGames:v2'] });
    const types: HubEvent[] = ['game:created', 'game:updated', 'game:cancelled', 'game:joined', 'game:left'];
    
    types.forEach(t => hubEvents.addEventListener(t, handler));
    return () => types.forEach(t => hubEvents.removeEventListener(t, handler));
  }, [qc]);
}
