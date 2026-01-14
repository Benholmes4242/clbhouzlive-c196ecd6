/**
 * useUserTripsRealtime - Realtime subscriptions for user's trips
 * Mirrors useUserGamesRealtime for trips
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { hubEvents, type HubEvent } from '@/lib/hubEvents';

export function useUserTripsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    // Supabase Realtime: DB → UI
    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel('trips-and-participants')
        // Trips where user is creator
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trips',
          filter: `created_by=eq.${user.id}`,
        }, () => {
          qc.invalidateQueries({ queryKey: ['user-trips'] });
        })
        // Trip participants where user is involved
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trip_participants',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          qc.invalidateQueries({ queryKey: ['user-trips'] });
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
    const handler = () => qc.invalidateQueries({ queryKey: ['user-trips'] });
    const types: HubEvent[] = ['trip:created', 'trip:updated', 'trip:cancelled', 'trip:joined', 'trip:left'];
    
    types.forEach(t => hubEvents.addEventListener(t, handler));
    return () => types.forEach(t => hubEvents.removeEventListener(t, handler));
  }, [qc]);
}
