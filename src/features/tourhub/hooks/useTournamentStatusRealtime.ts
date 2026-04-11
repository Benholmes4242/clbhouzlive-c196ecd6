/**
 * useTournamentStatusRealtime - Listens for tournament status transitions
 * (scheduled → inprogress → closed) and invalidates relevant caches.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTournamentStatusRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('tournament-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sr_tournaments',
        },
        (payload: any) => {
          if (payload.old?.status !== payload.new?.status) {
            queryClient.invalidateQueries({ queryKey: ['tournaments-cache'] });
            queryClient.invalidateQueries({ queryKey: ['ai-predictions'] });
            queryClient.invalidateQueries({ queryKey: ['tournament-top-leaders'] });
            queryClient.invalidateQueries({ queryKey: ['tourhub'] });
            queryClient.invalidateQueries({ queryKey: ['prediction-tracker'] });
            queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] });
            queryClient.invalidateQueries({ queryKey: ['live-arena'] });
            queryClient.invalidateQueries({ queryKey: ['hero-carousel-data'] });
            queryClient.invalidateQueries({ queryKey: ['live-tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['overview-live-tournaments'] });
            queryClient.invalidateQueries({ queryKey: ['pga-card-upcoming'] });
            queryClient.invalidateQueries({ queryKey: ['pga-card-next-major'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
