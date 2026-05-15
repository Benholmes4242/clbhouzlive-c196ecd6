/**
 * useTournamentLastYearTop4 — top 4 finishers from the prior-year instance.
 * Per HYBRID_HERO_PATCH_01_BRIEF §2.
 *
 * Used by Upcoming · far variant to populate the 4-row leaderboard band.
 * Returns null when no prior-year instance exists ("first year of this event").
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fmtScore } from '../components/overview-v3/HybridHero.utils';

export interface LastYearFinisher {
  rank: string;       // "1", "T2" — preserves tie notation
  name: string;
  country: string;
  score: string;
  year: string;
  photoUrl: string | null;
}

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/^the\s+/i, '')
    .replace(/\s+presented\s+by\s+.+$/i, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useTournamentLastYearTop4(tournamentId: string | null | undefined) {
  return useQuery<LastYearFinisher[] | null>({
    queryKey: ['hybrid-hero', 'last-year-top4', tournamentId],
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 60 * 24, // 24h — matches useTournamentDefendingChamp
    queryFn: async () => {
      if (!tournamentId) return null;

      // 1. Resolve current tournament name + tour + year
      const { data: current, error: currentErr } = await supabase
        .from('sr_tournaments')
        .select('id, name, start_date, season:sr_seasons!sr_tournaments_season_id_fkey(tour_name, year)')
        .eq('id', tournamentId)
        .maybeSingle();

      if (currentErr || !current) return null;

      const currentYear = new Date(current.start_date).getFullYear();
      const tourName = (current as any).season?.tour_name;
      if (!tourName) return null;
      const baseName = normaliseName(current.name);
      if (!baseName) return null;

      // 2. Find prior-year instance on same tour
      const { data: candidates, error: candErr } = await supabase
        .from('sr_tournaments')
        .select('id, name, end_date, season:sr_seasons!sr_tournaments_season_id_fkey(tour_name, year)')
        .lt('start_date', `${currentYear}-01-01`)
        .gte('start_date', `${currentYear - 2}-01-01`)
        .order('start_date', { ascending: false })
        .limit(50);

      if (candErr || !candidates) return null;

      const prior = candidates.find((c: any) => {
        if (c?.season?.tour_name !== tourName) return false;
        return normaliseName(c.name) === baseName;
      });
      if (!prior) return null;

      // 3. Top 4 finishers (lte 4 captures any ties at 1-4 naturally)
      const { data: rows, error: rowsErr } = await supabase
        .from('sr_leaderboards')
        .select('position, score, player:sr_players!sr_leaderboards_player_id_fkey(first_name, last_name, full_name, country, country_code, photo_url)')
        .eq('tournament_id', prior.id)
        .gt('strokes', 0)
        .not('position', 'is', null)
        .lte('position', 4)
        .order('position', { ascending: true });

      if (rowsErr || !rows || rows.length === 0) return null;

      const priorYear = (prior as any)?.season?.year ?? new Date(prior.end_date).getFullYear();

      // Tie detection — count occurrences of each position
      const positionCounts: Record<number, number> = {};
      rows.forEach((r: any) => {
        if (r.position != null) positionCounts[r.position] = (positionCounts[r.position] ?? 0) + 1;
      });

      return rows.map((r: any) => {
        const player = r.player;
        const name =
          player?.full_name ||
          `${player?.first_name ?? ''} ${player?.last_name ?? ''}`.trim() ||
          '—';
        const tied = positionCounts[r.position] > 1;
        return {
          rank: tied ? `T${r.position}` : String(r.position),
          name,
          country: player?.country_code || player?.country || '',
          score: fmtScore(r.score),
          year: String(priorYear),
          photoUrl: player?.photo_url ?? null,
        };
      });
    },
  });
}
