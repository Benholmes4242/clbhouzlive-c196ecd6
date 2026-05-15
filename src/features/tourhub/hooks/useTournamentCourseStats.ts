/**
 * useTournamentCourseStats — par / yardage from sr_tournaments.
 * Used by the Upcoming · far middle-band fallback chain.
 *
 * Per TOUR_HUB_POLISH_PATCH_BRIEF §4.6.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseStats {
  par: number | null;
  yardage: number | null;
  courseRecord: number | null;
  courseRecordHolder: string | null;
}

export function useTournamentCourseStats(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['course-stats', tournamentId],
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 60 * 24 * 7,
    queryFn: async (): Promise<CourseStats | null> => {
      if (!tournamentId) return null;
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('venue_par, venue_yardage')
        .eq('id', tournamentId)
        .maybeSingle();

      if (error || !data) return null;
      if (data.venue_par == null && data.venue_yardage == null) return null;

      return {
        par: data.venue_par ?? null,
        yardage: data.venue_yardage ?? null,
        courseRecord: null,
        courseRecordHolder: null,
      };
    },
  });
}
