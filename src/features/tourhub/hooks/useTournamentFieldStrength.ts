/**
 * useTournamentFieldStrength — entries / world-ranking snapshot for an upcoming event.
 *
 * No `sr_tournament_entries` (or equivalent) table exists in the schema today, so this
 * hook is wired as a no-op stub that always returns `null`. The MiddleBand fallback
 * chain falls through to CourseStatsStrip in that case. When entries data lands in
 * the schema, replace the queryFn body with the real lookup.
 *
 * Per TOUR_HUB_POLISH_PATCH_BRIEF §4.6.
 */

import { useQuery } from '@tanstack/react-query';

export interface FieldStrength {
  totalPlayers: number;
  topRanked: number | null;
  headshots: string[];
}

export function useTournamentFieldStrength(tournamentId: string | null | undefined) {
  return useQuery({
    queryKey: ['field-strength', tournamentId],
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async (): Promise<FieldStrength | null> => {
      // No entries table exists — return null so the fallback chain advances to course stats.
      return null;
    },
  });
}
