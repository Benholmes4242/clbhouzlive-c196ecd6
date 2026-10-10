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
export interface LeaderboardRealtimeOptions {
  /**
   * Which caches a row change invalidates.
   * - 'all' (default): every dependent key — TournamentPage's behaviour.
   * - 'leaderboard': only ['tourhub','leaderboard',tid]. The overview hero
   *   uses this: live sync upserts every row of the field each pass, so the
   *   full set would rebuild the whole carousel (a five-request fan-out) once
   *   per player per pass.
   */
  invalidate?: 'all' | 'leaderboard';
}

/**
 * Trailing coalescing window for leaderboard row changes.
 *
 * tournament-live-sync runs on a 60-second cycle and rewrites EVERY row of the
 * field each pass, so a 144-player event arrives as ~144 postgres_changes
 * events in a burst. A few seconds captures a whole burst while still landing
 * well inside the 60s cycle; the board was designed around a 30s staleTime,
 * so 4s is far tighter than its freshness budget, and a 4s delay on a golf
 * score is imperceptible. If the sync cycle changes, revisit this window.
 */
/* ARCHITECTURE RULE (moved from AGENTS.md): useLeaderboardRealtime coalesces row changes on one trailing window (LEADERBOARD_REALTIME_COALESCE_MS) for every caller and cancels a pending flush on unmount or tournament change, because live sync rewrites the whole field each cycle. */
export const LEADERBOARD_REALTIME_COALESCE_MS = 4000;

export function useLeaderboardRealtime(
  tournamentId: string | null | undefined,
  { invalidate = 'all' }: LeaderboardRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'leaderboard', tournamentId] });
      if (invalidate === 'leaderboard') return;
      // Invalidate all queries that depend on this tournament's leaderboard
      queryClient.invalidateQueries({ queryKey: ['tournament-top-leaders', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tourhub', 'pick-history'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tracker', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] });
      queryClient.invalidateQueries({ queryKey: ['live-arena'] });
      queryClient.invalidateQueries({ queryKey: ['hero-carousel-data'] });
      queryClient.invalidateQueries({ queryKey: ['overview-live-right-now'] });
      queryClient.invalidateQueries({ queryKey: ['live-leader-teaser'] });
    };

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
          // Trailing window: restart on each event so a whole burst produces
          // one flush; a lone event still flushes after the window.
          if (timer) clearTimeout(timer);
          timer = setTimeout(flush, LEADERBOARD_REALTIME_COALESCE_MS);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      // Cancel (not flush): no invalidation may fire for a tournament that is
      // no longer on screen (unmount, slide change, or tournament id change).
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient, invalidate]);

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
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            queryClient.invalidateQueries({ queryKey: ['tourhub', 'pick-history'] });
            queryClient.invalidateQueries({ queryKey: ['prediction-tracker', tid] });
            queryClient.invalidateQueries({ queryKey: ['tournament-leaders-winners'] });
            queryClient.invalidateQueries({ queryKey: ['hero-carousel-data'] });
            queryClient.invalidateQueries({ queryKey: ['overview-live-right-now'] });
            queryClient.invalidateQueries({ queryKey: ['live-leader-teaser'] });
            // Debounce live-arena invalidation to prevent rapid feed rebuilds
            if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
            invalidateTimerRef.current = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['live-arena'] });
            }, 2000);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    idsRef.current = idsKey;

    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [idsKey, queryClient]);

  return { isConnected };
}
