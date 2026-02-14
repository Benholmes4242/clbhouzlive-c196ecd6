/**
 * useTournamentLiveUpdates - DEPRECATED
 * 
 * Previously: Per-user polling that triggered Sportradar API calls every 30s.
 * Now: Replaced by useLeaderboardRealtime + centralised cron sync.
 * 
 * This file is kept for reference only. No components should import from it.
 * @deprecated Use useLeaderboardRealtime instead.
 */

import { useState, useCallback } from 'react';

interface UseTournamentLiveUpdatesOptions {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  enabled?: boolean;
}

/**
 * @deprecated Use useLeaderboardRealtime instead. This hook is a no-op stub.
 */
export function useTournamentLiveUpdates(_options: UseTournamentLiveUpdatesOptions) {
  const [isRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    console.warn('[useTournamentLiveUpdates] DEPRECATED — use useLeaderboardRealtime instead');
    return false;
  }, []);

  return {
    lastUpdated: null,
    lastUpdatedText: null,
    secondsAgo: null,
    isRefreshing,
    refresh,
  };
}
