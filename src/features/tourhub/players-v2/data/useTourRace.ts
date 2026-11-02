/**
 * useTourRace — the season race for one tour: its tour_races row, its
 * tour_stakes lines (ordered by after_position) and, when the race has a
 * phase, the tour's stroke-play events inside that phase for the race clock.
 * No race row → race null; the page falls back to TOUR_CONFIG name with no
 * clock and no line cards.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { currentSeasonYear } from '../../_shared/stats/useLeaderCategories';
import { mapTourSlug } from '../../_shared/tourOrder';
import { isStrokeEvent } from '../../_shared/eventFormat';
import type { Database } from '@/integrations/supabase/types';
import type { ClockEvent, Stake } from '../playersRules';
import type { PlayersTourId } from './usePlayersRanking';

export type TourRace = Database['public']['Tables']['tour_races']['Row'];

export interface TourRaceResult {
  race: TourRace | null;
  /** The season the race row belongs to — the newest tour_races year not past
   *  currentSeasonYear(). Sibling reads use it so a race that is still the
   *  live one (e.g. a 2026 FedEx Fall in November) is not missed. */
  seasonYear: number;
  stakes: Stake[];
  events: ClockEvent[];
}

const FINISHED = new Set(['closed', 'complete', 'completed', 'final', 'finished']);

export function useTourRace(tour: PlayersTourId) {
  const year = currentSeasonYear();
  return useQuery<TourRaceResult>({
    queryKey: ['players-v2', 'race', tour, year],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const raceRes = await supabase.from('tour_races').select('*').eq('tour_code', tour).lte('season_year', year)
        .order('season_year', { ascending: false }).limit(1).maybeSingle();
      if (raceRes.error) throw raceRes.error;
      const seasonYear = raceRes.data?.season_year ?? year;
      const stakesRes = await supabase.from('tour_stakes').select('*').eq('tour_code', tour).eq('season_year', seasonYear).order('after_position', { ascending: true });
      if (stakesRes.error) throw stakesRes.error;
      const race = raceRes.data ?? null;
      const stakes: Stake[] = race ? (stakesRes.data ?? []) : [];
      let events: ClockEvent[] = [];
      if (race?.phase_start) {
        let q = supabase
          .from('sr_tournaments')
          .select('id, name, status, start_date, end_date, event_type, season:sr_seasons!inner(tour_name)')
          .gte('start_date', race.phase_start)
          .order('start_date', { ascending: true })
          .limit(60);
        if (race.closes_on) q = q.lte('end_date', race.closes_on);
        const { data, error } = await q;
        if (error) throw error;
        const today = new Date().toISOString().slice(0, 10);
        type Row = { id: string; name: string; status: string | null; start_date: string; end_date: string | null; event_type: string | null; season: { tour_name: string | null } | { tour_name: string | null }[] | null };
        events = ((data ?? []) as unknown as Row[])
          .filter((r) => {
            const season = Array.isArray(r.season) ? r.season[0] : r.season;
            return mapTourSlug(season?.tour_name) === tour && isStrokeEvent(r.event_type);
          })
          .map((r) => ({
            id: r.id,
            name: r.name,
            startDate: r.start_date,
            endDate: r.end_date,
            finished: FINISHED.has((r.status ?? '').toLowerCase()) || (r.end_date != null && r.end_date < today),
          }));
      }
      return { race, seasonYear, stakes, events };
    },
  });
}
