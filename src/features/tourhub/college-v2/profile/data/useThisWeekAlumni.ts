/**
 * useThisWeekAlumni — leaderboard rows for alumni playing THIS WEEK.
 *
 * ONE query. Filters sr_leaderboards by (a) player_id ∈ college alumni ids,
 * and (b) tournament with end_date inside the current Sun–Sat week (or
 * currently in-progress). Live status is derived from tournament.status.
 *
 * Verified columns (types.ts):
 *   sr_leaderboards:  player_id, position, position_tied, score, thru,
 *                     status, money, today
 *   sr_tournaments:   id, name, status, start_date, end_date
 *   sr_players:       id, first_name, last_name, full_name, photo_url,
 *                     country, tour_codes, college_normalized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentWeek } from '@/features/tourhub/utils/getCurrentWeek';

export interface WeekAlumnusRow {
  playerId: string;
  fullName: string;
  photoUrl: string | null;
  tourCodes: string[] | null;
  tournamentId: string;
  tournamentName: string;
  isLive: boolean;
  position: number | null;
  positionTied: boolean | null;
  thru: number | null;
  score: number | null;
  money: number | null;
}

export function useThisWeekAlumni(normalizedName: string | undefined) {
  return useQuery<WeekAlumnusRow[]>({
    queryKey: ['college-v2', 'this-week-alumni', normalizedName ?? 'none'],
    enabled: !!normalizedName,
    staleTime: 60_000,
    refetchInterval: 90_000,
    queryFn: async () => {
      if (!normalizedName) return [];

      // Alumni ids for this college.
      const { data: alumni } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, photo_url, tour_codes')
        .eq('college_normalized', normalizedName);
      if (!alumni?.length) return [];
      const alumniIds = alumni.map((a) => a.id);
      const alumniById = new Map(alumni.map((a) => [a.id, a]));

      const { start, end } = getCurrentWeek();
      const startISO = start.toISOString().slice(0, 10);
      const endISO = end.toISOString().slice(0, 10);

      // sr_leaderboards joined with tournament, filtered on tournament dates.
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          'player_id, position, position_tied, score, thru, money, ' +
          'tournament:sr_tournaments!inner(id, name, status, start_date, end_date)',
        )
        .in('player_id', alumniIds)
        .lte('tournament.start_date', endISO)
        .gte('tournament.end_date', startISO)
        .limit(500);
      if (error || !data) return [];

      const rows: WeekAlumnusRow[] = [];
      for (const r of data as any[]) {
        const t = r.tournament;
        if (!t) continue;
        const a = alumniById.get(r.player_id);
        if (!a) continue;
        rows.push({
          playerId: r.player_id,
          fullName: (a as any).full_name || `${(a as any).first_name ?? ''} ${(a as any).last_name ?? ''}`.trim() || 'Alumnus',
          photoUrl: (a as any).photo_url ?? null,
          tourCodes: (a as any).tour_codes ?? null,
          tournamentId: t.id,
          tournamentName: t.name ?? '',
          isLive: t.status === 'inprogress',
          position: r.position ?? null,
          positionTied: r.position_tied ?? null,
          thru: r.thru ?? null,
          score: r.score ?? null,
          money: r.money ?? null,
        });
      }

      rows.sort((a, b) => {
        // Live first, then by position asc (nulls last).
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        const ap = a.position ?? 9999;
        const bp = b.position ?? 9999;
        return ap - bp;
      });
      return rows;
    },
  });
}
