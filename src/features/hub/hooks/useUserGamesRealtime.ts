import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useUserGamesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('games-and-participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        qc.invalidateQueries({ queryKey: ['userGames:v2'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_participants' }, () => {
        qc.invalidateQueries({ queryKey: ['userGames:v2'] });
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [qc]);
}
