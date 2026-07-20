/**
 * useCollegeRoster — full roster for one college with per-player season stats.
 *
 * Verified columns (types.ts):
 *   sr_players:            id, first_name, last_name, full_name, country,
 *                          photo_url, tour_codes, college, college_normalized
 *   sr_player_statistics:  player_id, season_id, wins, events_played, raw_data
 *
 * Returns rows sorted by earnings desc (Stars first is applied at UI level).
 * JSON-safe.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from '@/features/tourhub/hooks/useCollegeStats';

export interface RosterAlumnus {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  country: string | null;
  photoUrl: string | null;
  tourCodes: string[] | null;
  earnings: number;
  wins: number;
  eventsPlayed: number;
  worldRanking: number | null;
}

export function useCollegeRoster(normalizedName: string | undefined) {
  const seasonId = useCurrentSeasonId();

  return useQuery<RosterAlumnus[]>({
    queryKey: ['college-v2', 'roster', normalizedName ?? 'none', seasonId ?? 'none'],
    enabled: !!normalizedName,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!normalizedName) return [];

      const { data: players, error: pErr } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, full_name, country, photo_url, tour_codes, college')
        .eq('college_normalized', normalizedName);
      if (pErr || !players?.length) return [];

      const ids = players.map((p) => p.id);
      const statsMap = new Map<string, { wins: number; events: number; earnings: number; owgr: number | null }>();

      if (seasonId) {
        const { data: stats, error: statsErr } = await supabase
          .from('sr_player_statistics')
          .select('player_id, wins, events_played, raw_data')
          .eq('season_id', seasonId)
          .in('player_id', ids);
        if (statsErr) throw statsErr;
        for (const s of stats ?? []) {
          const raw = (s.raw_data ?? {}) as Record<string, unknown>;
          const statistics = (raw.statistics ?? {}) as Record<string, unknown>;
          statsMap.set(s.player_id, {
            wins: typeof s.wins === 'number' ? s.wins : (typeof statistics.first_place === 'number' ? statistics.first_place : 0),
            events: typeof s.events_played === 'number' ? s.events_played : 0,
            earnings: typeof statistics.earnings === 'number' ? statistics.earnings : 0,
            owgr: typeof statistics.world_rank === 'number' ? statistics.world_rank : null,
          });
        }
      }

      const rows: RosterAlumnus[] = players.map((p) => {
        const s = statsMap.get(p.id);
        return {
          id: p.id,
          firstName: p.first_name ?? '',
          lastName: p.last_name ?? '',
          fullName: p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Alumnus',
          country: p.country ?? null,
          photoUrl: p.photo_url ?? null,
          tourCodes: (p as { tour_codes?: string[] | null }).tour_codes ?? null,
          earnings: s?.earnings ?? 0,
          wins: s?.wins ?? 0,
          eventsPlayed: s?.events ?? 0,
          worldRanking: s?.owgr ?? null,
        };
      });

      rows.sort((a, b) => b.earnings - a.earnings || (b.wins - a.wins));
      return rows;
    },
  });
}
