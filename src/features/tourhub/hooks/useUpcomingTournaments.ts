/**
 * useUpcomingTournaments - Fetches upcoming tournaments across ALL tours
 * Used by the WhatsComing overview module
 * Returns chronologically ordered, limited to first N
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SeasonTournament } from './useSeasonTournaments';

const TOUR_KEY_MAP: Record<string, string> = {
  pga: 'PGA Tour',
  liv: 'LIV Golf',
  euro: 'DP World Tour',
  pgad: 'Korn Ferry Tour',
  champ: 'Champions Tour',
  lpga: 'LPGA Tour',
};

export function useUpcomingTournaments(limit = 6) {
  return useQuery({
    queryKey: ['upcoming-tournaments', limit],
    queryFn: async (): Promise<SeasonTournament[]> => {
      const currentYear = new Date().getFullYear();

      // Get all season IDs for the current year
      const { data: seasons, error: seasonError } = await supabase
        .from('sr_seasons')
        .select('id, tour_name, year')
        .eq('year', currentYear);

      if (seasonError) throw seasonError;
      if (!seasons?.length) return [];

      const seasonIds = seasons.map((s) => s.id);
      const seasonMap = new Map(seasons.map((s) => [s.id, s]));

      // Fetch upcoming/scheduled tournaments across all tours
      const { data: tournaments, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          purse,
          venue_name,
          venue_city,
          venue_state,
          venue_country,
          venue_par,
          venue_yardage,
          season_id
        `)
        .in('season_id', seasonIds)
        .in('status', ['scheduled', 'created'])
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!tournaments?.length) return [];

      return tournaments.map((t: any) => {
        const season = seasonMap.get(t.season_id);
        const tourKey = season?.tour_name?.toLowerCase() || '';

        return {
          id: t.id,
          name: t.name,
          status: t.status,
          startDate: t.start_date,
          endDate: t.end_date,
          purse: t.purse,
          venueName: t.venue_name,
          venueCity: t.venue_city,
          venueState: t.venue_state,
          venueCountry: t.venue_country,
          venuePar: t.venue_par,
          venueYardage: t.venue_yardage,
          tourName: TOUR_KEY_MAP[tourKey] || season?.tour_name || 'Tour Event',
          year: season?.year || currentYear,
          winnerId: null,
          winnerFirstName: null,
          winnerLastName: null,
          winnerPhotoUrl: null,
        };
      });
    },
    staleTime: 10 * 60 * 1000,
  });
}
