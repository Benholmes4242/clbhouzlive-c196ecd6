/**
 * useLiveTournamentSync - Background polling for live tournament data
 * 
 * This hook runs on the main TourHub pages and:
 * 1. Checks every 60 seconds for tournaments with status = 'inprogress'
 * 2. If live tournaments exist, syncs leaderboard, tee times, and hole stats
 * 3. Updates the database with fresh data from SportRadar
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const POLL_INTERVAL = 60 * 1000; // 60 seconds

interface LiveTournament {
  id: string;
  sr_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

export function useLiveTournamentSync() {
  const queryClient = useQueryClient();
  const syncInProgressRef = useRef(false);
  const lastSyncRef = useRef<Date | null>(null);

  // Query for live tournaments
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
    refetchInterval: POLL_INTERVAL,
    staleTime: 30 * 1000,
  });

  // Sync function for a single tournament
  const syncTournamentData = useCallback(async (tournament: LiveTournament) => {
    console.log(`[LiveSync] Syncing data for: ${tournament.name}`);
    
    try {
      // Sync leaderboard
      const leaderboardResult = await supabase.functions.invoke('sportradar-sync', {
        body: {
          action: 'leaderboard',
          tournamentId: tournament.sr_id,
          tourId: 'pga',
          year: new Date().getFullYear(),
        },
      });
      
      if (leaderboardResult.error) {
        console.error('[LiveSync] Leaderboard sync error:', leaderboardResult.error);
      } else {
        console.log('[LiveSync] Leaderboard synced:', leaderboardResult.data?.records_synced || 0, 'records');
      }

      // Sync tee times for current and next rounds
      for (const roundNumber of [1, 2, 3, 4]) {
        const teeTimesResult = await supabase.functions.invoke('sportradar-sync', {
          body: {
            action: 'tee_times',
            tournamentId: tournament.sr_id,
            tourId: 'pga',
            year: new Date().getFullYear(),
            roundNumber,
          },
        });
        
        if (teeTimesResult.data?.records_synced > 0) {
          console.log(`[LiveSync] Tee times R${roundNumber} synced:`, teeTimesResult.data.records_synced, 'records');
        }
      }

      // Sync hole statistics
      const holeStatsResult = await supabase.functions.invoke('sportradar-sync', {
        body: {
          action: 'hole_stats',
          tournamentId: tournament.sr_id,
          tourId: 'pga',
          year: new Date().getFullYear(),
        },
      });
      
      if (holeStatsResult.error) {
        console.error('[LiveSync] Hole stats sync error:', holeStatsResult.error);
      } else {
        console.log('[LiveSync] Hole stats synced:', holeStatsResult.data?.records_synced || 0, 'records');
      }

      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['tour-leaderboard', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-tournament', tournament.id] });
      
      return true;
    } catch (error) {
      console.error('[LiveSync] Error syncing tournament:', error);
      return false;
    }
  }, [queryClient]);

  // Main sync effect
  useEffect(() => {
    if (!liveTournaments || liveTournaments.length === 0) {
      return;
    }

    const runSync = async () => {
      if (syncInProgressRef.current) {
        console.log('[LiveSync] Sync already in progress, skipping...');
        return;
      }

      syncInProgressRef.current = true;
      console.log(`[LiveSync] Found ${liveTournaments.length} live tournament(s)`);

      for (const tournament of liveTournaments) {
        await syncTournamentData(tournament);
      }

      lastSyncRef.current = new Date();
      syncInProgressRef.current = false;
      console.log('[LiveSync] Sync complete at', lastSyncRef.current.toISOString());
    };

    // Run sync immediately on first detection of live tournaments
    runSync();

    // Set up polling interval
    const intervalId = setInterval(runSync, POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [liveTournaments, syncTournamentData]);

  return {
    liveTournaments: liveTournaments || [],
    isLive: (liveTournaments?.length || 0) > 0,
    lastSync: lastSyncRef.current,
  };
}
