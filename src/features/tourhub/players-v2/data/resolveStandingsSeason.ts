/**
 * resolveStandingsSeason — the newest season year that has REAL standings,
 * which every Players read follows (ranking, race, movement, form, scorecard,
 * line picks). Over the winter the page stays on last season (finished, with
 * its lines and settled picks); once the new season has points it switches.
 *   PGA:   newest sr_seasons.year (tour_name 'pga') with ≥1 sr_player_statistics row fedex_points > 0.
 *   Other: newest tour_season_rankings.season_year for the tour_code with ≥1 row points > 0.
 * Null when no season has points. Cached 30 minutes.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlayersTourId } from './usePlayersRanking';

export async function resolveStandingsSeason(tour: PlayersTourId): Promise<number | null> {
  if (tour === 'pga') {
    const { data, error } = await supabase
      .from('sr_seasons')
      .select('id, year')
      .eq('tour_name', 'pga')
      .order('year', { ascending: false })
      .limit(10);
    if (error) throw error;
    for (const s of (data ?? []) as Array<{ id: string; year: number | null }>) {
      if (s.year == null) continue;
      const { data: hit, error: e } = await supabase
        .from('sr_player_statistics')
        .select('player_id')
        .eq('season_id', s.id)
        .gt('fedex_points', 0)
        .limit(1);
      if (e) throw e;
      if ((hit ?? []).length) return s.year;
    }
    return null;
  }
  const { data, error } = await supabase
    .from('tour_season_rankings' as never)
    .select('season_year')
    .eq('tour_code', tour)
    .gt('points', 0)
    .order('season_year', { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = ((data ?? []) as unknown as Array<{ season_year: number | null }>)[0];
  return row?.season_year ?? null;
}

export function useStandingsSeason(tour: PlayersTourId) {
  return useQuery<number | null>({
    queryKey: ['players-v2', 'standings-season', tour],
    staleTime: 30 * 60_000,
    queryFn: () => resolveStandingsSeason(tour),
  });
}
