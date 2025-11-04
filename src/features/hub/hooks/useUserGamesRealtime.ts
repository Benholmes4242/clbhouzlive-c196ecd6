import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { hubEvents, type HubEvent } from '@/lib/hubEvents';

export function useUserGamesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    // Supabase Realtime: DB → UI
    const channel = supabase
      .channel('games-and-participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        qc.invalidateQueries({ queryKey: ['userGamesV2'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_participants' }, () => {
        qc.invalidateQueries({ queryKey: ['userGamesV2'] });
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [qc]);

  useEffect(() => {
    // Event Bridge: UI → UI (instant local updates)
    const handler = () => qc.invalidateQueries({ queryKey: ['userGamesV2'] });
    const types: HubEvent[] = ['game:created', 'game:updated', 'game:cancelled', 'game:joined', 'game:left'];
    
    types.forEach(t => hubEvents.addEventListener(t, handler));
    return () => types.forEach(t => hubEvents.removeEventListener(t, handler));
  }, [qc]);
}
