/**
 * useUpcomingTournaments - Reads from shared tournaments cache
 * Used by the WhatsComing overview module
 * Returns chronologically ordered, limited to first N
 */

import { useQuery } from '@tanstack/react-query';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';
import type { SeasonTournament } from './useSeasonTournaments';

// Slug → display name for tournament rows (display only, distinct from TOUR_NAME_TO_SLUG which maps the reverse)
const TOUR_DISPLAY_NAMES: Record<string, string> = {
  pga: 'PGA Tour',
  liv: 'LIV Golf',
  euro: 'DP World Tour',
  pgad: 'Korn Ferry Tour',
  champ: 'Champions Tour',
  lpga: 'LPGA Tour',
};

export function useUpcomingTournaments(limit = 6) {
  const { data: cache } = useTournamentsCache();

  return useQuery({
    queryKey: ['upcoming-tournaments', limit, cache ? 'ready' : 'waiting'],
    queryFn: async (): Promise<SeasonTournament[]> => {
      if (!cache?.upcoming.length) return [];

      return cache.upcoming.slice(0, limit).map((t) => {
        const tourKey = t.season?.tour_name?.toLowerCase() || '';

        return {
          id: t.id,
          name: t.name,
          status: t.status,
          startDate: t.start_date,
          endDate: t.end_date,
          purse: t.purse,
          venueName: t.venue_name,
          venueCity: t.venue_city,
          venueState: null,
          venueCountry: t.venue_country,
          venuePar: t.venue_par,
          venueYardage: t.venue_yardage,
          tourName: TOUR_DISPLAY_NAMES[tourKey] || t.season?.tour_name || 'Tour Event',
          year: t.season?.year || new Date().getFullYear(),
          winnerId: null,
          winnerFirstName: null,
          winnerLastName: null,
          winnerPhotoUrl: null,
          defendingChampion: t.defending_champion ?? null,
          currentRound: (t as any).current_round ?? null,
        };
      });
    },
    enabled: !!cache,
    staleTime: 30_000,
  });
}
