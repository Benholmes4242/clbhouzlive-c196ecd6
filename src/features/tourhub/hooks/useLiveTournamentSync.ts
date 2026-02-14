/**
 * useLiveTournamentSync - DEPRECATED
 * 
 * Previously: Background polling that triggered per-user Sportradar API calls.
 * Now: Replaced by Supabase Realtime + centralised cron sync.
 * 
 * This hook is kept for backward compatibility but no longer triggers any API calls.
 * It only queries for live tournaments from the DB (passive read).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LiveTournament {
  id: string;
  sr_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

/**
 * @deprecated Use useLeaderboardRealtime + useTournamentStatusRealtime instead.
 * This hook no longer triggers any Sportradar sync calls.
 */
export function useLiveTournamentSync() {
  const { data: liveTournaments } = useQuery({
    queryKey: ['live-tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, sr_id, name, status, start_date, end_date')
        .eq('status', 'inprogress')
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('[LiveSync] Error fetching live tournaments:', error);
        return [];
      }
      
      return (data || []) as LiveTournament[];
    },
    staleTime: 5 * 1000,          // 5s — Realtime handles freshness
    refetchInterval: false,        // No polling — Realtime pushes updates
    refetchOnWindowFocus: true,
  });

  return {
    liveTournaments: liveTournaments || [],
    isLive: (liveTournaments?.length || 0) > 0,
    lastSync: null,
  };
}
