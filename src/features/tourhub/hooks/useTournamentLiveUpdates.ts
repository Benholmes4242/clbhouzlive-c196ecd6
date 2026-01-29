/**
 * useTournamentLiveUpdates - Polling for individual live tournament detail pages
 * 
 * This hook provides:
 * 1. Real-time-ish updates every 30 seconds for live tournaments
 * 2. "Last updated" timestamp tracking
 * 3. Manual refresh capability
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LIVE_POLL_INTERVAL = 30 * 1000; // 30 seconds for live tournaments

interface UseTournamentLiveUpdatesOptions {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  enabled?: boolean;
}

export function useTournamentLiveUpdates({
  tournamentId,
  tournamentSrId,
  isLive,
  enabled = true,
}: UseTournamentLiveUpdatesOptions) {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const syncInProgressRef = useRef(false);

  // Sync function
  const syncData = useCallback(async (manual = false) => {
    if (!tournamentSrId || syncInProgressRef.current) {
      return false;
    }

    syncInProgressRef.current = true;
    if (manual) setIsRefreshing(true);
    
    console.log(`[TournamentLive] ${manual ? 'Manual' : 'Auto'} refresh for tournament:`, tournamentId);

    try {
      // Sync leaderboard
      const leaderboardResult = await supabase.functions.invoke('sportradar-sync', {
        body: {
          action: 'leaderboard',
          tournamentId: tournamentSrId,
          tourId: 'pga',
          year: new Date().getFullYear(),
        },
      });

      if (leaderboardResult.error) {
        console.error('[TournamentLive] Leaderboard sync error:', leaderboardResult.error);
      }

      // Sync hole stats
      await supabase.functions.invoke('sportradar-sync', {
        body: {
          action: 'hole_stats',
          tournamentId: tournamentSrId,
          tourId: 'pga',
          year: new Date().getFullYear(),
        },
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['tour-leaderboard', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tour-tournament', tournamentId] });

      const now = new Date();
      setLastUpdated(now);
      setSecondsAgo(0);
      
      console.log('[TournamentLive] Sync complete at', now.toISOString());
      return true;
    } catch (error) {
      console.error('[TournamentLive] Sync error:', error);
      return false;
    } finally {
      syncInProgressRef.current = false;
      if (manual) setIsRefreshing(false);
    }
  }, [tournamentId, tournamentSrId, queryClient]);

  // Manual refresh
  const refresh = useCallback(() => {
    return syncData(true);
  }, [syncData]);

  // Auto-polling for live tournaments
  useEffect(() => {
    if (!isLive || !enabled || !tournamentSrId) {
      return;
    }

    // Initial sync
    syncData(false);

    // Set up polling
    const intervalId = setInterval(() => {
      syncData(false);
    }, LIVE_POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLive, enabled, tournamentSrId, syncData]);

  // Update "seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return;

    const updateSecondsAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
      setSecondsAgo(diff);
    };

    updateSecondsAgo();
    const intervalId = setInterval(updateSecondsAgo, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastUpdated]);

  // Format the "seconds ago" for display
  const getLastUpdatedText = useCallback(() => {
    if (secondsAgo === null) return null;
    
    if (secondsAgo < 5) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    
    const minutes = Math.floor(secondsAgo / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [secondsAgo]);

  return {
    lastUpdated,
    lastUpdatedText: getLastUpdatedText(),
    secondsAgo,
    isRefreshing,
    refresh,
  };
}
