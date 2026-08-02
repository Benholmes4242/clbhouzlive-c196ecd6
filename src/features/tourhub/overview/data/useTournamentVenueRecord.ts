/**
 * useTournamentVenueRecord — the clubhouse record for the venue hosting a
 * tournament. Reads public.get_tournament_venue_record(p_tournament_id),
 * which resolves sr_tournaments.golf_course_id and joins the community
 * rating + Top 100 placement.
 *
 * Returns null when the tournament has no linked course (ingestion gap) —
 * callers self-hide rather than reserving space.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentVenueRecord {
  courseId: string;
  courseName: string;
  coursePlace: string | null;
  listLabel: string | null;
  listRank: number | null;
  rating: number | null;
  reviewCount: number | null;
}

export function useTournamentVenueRecord(tournamentId: string | undefined) {
  return useQuery<TournamentVenueRecord | null>({
    queryKey: ['tourhub', 'venue-record', tournamentId],
    enabled: !!tournamentId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tournament_venue_record', {
        p_tournament_id: tournamentId as string,
      });
      if (error) throw error;
      const row = (data as any[] | null)?.[0];
      if (!row?.course_id) return null;
      return {
        courseId: row.course_id,
        courseName: row.course_name,
        coursePlace: row.course_place ?? null,
        listLabel: row.list_label ?? null,
        listRank: row.list_rank ?? null,
        rating: row.rating ?? null,
        reviewCount: row.review_count ?? null,
      };
    },
  });
}
