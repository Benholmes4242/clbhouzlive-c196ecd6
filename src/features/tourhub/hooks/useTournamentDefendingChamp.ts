/**
 * useTournamentDefendingChamp — last year's winner data for an Upcoming tournament.
 * Per §7.2 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 *
 * Looks up the prior-year instance of the same tournament (by tour + name basename)
 * and returns the winner. Returns null when no prior instance exists or the winner
 * cannot be resolved — the hero's MiddleBand fallback chain handles null gracefully.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fmtScore } from '../utils/fmtScore';

export interface DefendingChampData {
  name: string;
  country: string;
  score: string;
  year: string;
}

function normaliseName(name: string): string {
  // Strip year prefix/suffix, trim sponsor prefixes that change yearly.
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useTournamentDefendingChamp(tournamentId: string | null | undefined) {
  return useQuery<DefendingChampData | null>({
    queryKey: ['hybrid-hero', 'defending-champ', 'v2', tournamentId],
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 60 * 24, // 24h — prior winner doesn't change mid-week
    queryFn: async () => {
      if (!tournamentId) return null;

      // 1. Resolve current tournament to get tour + name + year
      const { data: current, error: currentErr } = await supabase
        .from('sr_tournaments')
        .select('id, name, start_date, defending_champion, season:sr_seasons!sr_tournaments_season_id_fkey(tour_name, year)')
        .eq('id', tournamentId)
        .maybeSingle();

      if (currentErr || !current) return null;

      const currentYear = new Date(current.start_date).getFullYear();
      const tourName = (current as any).season?.tour_name;
      const baseName = normaliseName(current.name);

      // Fallback band built from the tournament's own defending_champion string.
      const fallbackName = (current as any).defending_champion as string | null;
      const fallbackBand: DefendingChampData | null = fallbackName
        ? { name: fallbackName, country: '', score: '', year: String(currentYear - 1) }
        : null;

      if (!tourName || !baseName) return fallbackBand;

      // 2. Find prior-year tournament on the SAME tour (filter by tour + prior year in DB).
      // Inner-join filter on season keeps the result small and guarantees the match is
      // reachable regardless of date (the old .limit(50) cut off mid-season events).
      const { data: candidates, error: candErr } = await supabase
        .from('sr_tournaments')
        .select('id, name, end_date, season:sr_seasons!inner(tour_name, year)')
        .eq('sr_seasons.tour_name', tourName)
        .eq('sr_seasons.year', currentYear - 1)
        .limit(200);

      if (candErr || !candidates) return fallbackBand;

      const prior = candidates.find((c: any) => normaliseName(c.name) === baseName);
      if (!prior) return fallbackBand;

      // 3. Fetch position-1 finisher (for score + country enrichment)
      const { data: winnerRow } = await supabase
        .from('sr_leaderboards')
        .select('score, player:sr_players!sr_leaderboards_player_id_fkey(first_name, last_name, full_name, country, country_code)')
        .eq('tournament_id', prior.id)
        .eq('position', 1)
        .gt('strokes', 0)
        .limit(1)
        .maybeSingle();

      const player: any = (winnerRow as any)?.player;
      if (!player) return fallbackBand;
      const name =
        player.full_name ||
        `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim()
        || fallbackName || '';
      if (!name) return fallbackBand;

      const priorYear = (prior as any)?.season?.year ?? new Date(prior.end_date).getFullYear();

      return {
        name,
        country: player.country_code || player.country || '',
        score: fmtScore(winnerRow?.score ?? 0),
        year: String(priorYear),
      };
    },
  });
}
