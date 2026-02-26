/**
 * useLeaderboardRealtime - Supabase Realtime subscription for leaderboard updates
 * 
 * Listens for postgres_changes on sr_leaderboards and invalidates React Query caches.
 * Uses a single global channel (no per-tournament filter) to minimize connections.
 * Falls back to polling if the Realtime connection drops.
 */

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to real-time leaderboard updates for a specific tournament.
 * Returns connection status for fallback polling.
 */
export function useLeaderboardRealtime(tournamentId: string | null | undefined) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`leaderboard-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sr_leaderboards',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          // Invalidate all queries that depend on this tournament's leaderboard
          queryClient.invalidateQueries({ queryKey: ['tournament-top-leaders', tournamentId] });
          queryClient.invalidateQueries({ queryKey: ['tourhub', 'leaderboard', tournamentId] });
          queryClient.invalidateQueries({ queryKey: ['prediction-tracker', tournamentId] });
          queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] });
          queryClient.invalidateQueries({ queryKey: ['live-arena'] });
          queryClient.invalidateQueries({ queryKey: ['hero-carousel-data'] });
          queryClient.invalidateQueries({ queryKey: ['overview-live-right-now'] });
          queryClient.invalidateQueries({ queryKey: ['live-leader-teaser'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);

  return { isConnected };
}

/**
 * Subscribe to real-time leaderboard updates for multiple tournaments.
 * Uses a single unfiltered channel for efficiency when tracking many tournaments.
 */
export function useMultiLeaderboardRealtime(tournamentIds: (string | null | undefined)[]) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const idsRef = useRef<string>('');

  // Stable key for the dependency
  const validIds = tournamentIds.filter(Boolean) as string[];
  const idsKey = validIds.sort().join(',');

  useEffect(() => {
    if (validIds.length === 0) return;

    // Use a single channel for all leaderboard changes (scales better)
    const channel = supabase
      .channel('multi-leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sr_leaderboards',
        },
        (payload: any) => {
          const tid = payload.new?.tournament_id || payload.old?.tournament_id;
          if (tid && validIds.includes(tid)) {
            queryClient.invalidateQueries({ queryKey: ['tournament-top-leaders', tid] });
            queryClient.invalidateQueries({ queryKey: ['tourhub', 'leaderboard', tid] });
            queryClient.invalidateQueries({ queryKey: ['prediction-tracker', tid] });
            queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] });
            queryClient.invalidateQueries({ queryKey: ['live-arena'] });
            queryClient.invalidateQueries({ queryKey: ['hero-carousel-data'] });
            queryClient.invalidateQueries({ queryKey: ['overview-live-right-now'] });
            queryClient.invalidateQueries({ queryKey: ['live-leader-teaser'] });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    idsRef.current = idsKey;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idsKey, queryClient]);

  return { isConnected };
}
