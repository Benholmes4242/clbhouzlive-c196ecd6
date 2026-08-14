import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '@/features/tourhub/_shared/tourOrder';
import { getTournamentDisplayState } from '@/utils/tournamentState';

/**
 * useTourThisWeek — one card per venue playing THIS WEEK across the tours
 * (BRIEF, section 3). Reads the same sr_tournaments source the Tour Hub
 * overview reads; no new ingestion.
 *
 * If nothing is in play this week, the NEXT upcoming event per tour surfaces
 * instead and the when-chip carries the date rather than the play days.
 *
 * LIVE MODE (BRIEF_DISCOVER_LIVE_TOUR): liveness is NOT a second definition —
 * it reuses getTournamentDisplayState (src/utils/tournamentState.ts), the same
 * derivation the Tour Hub uses, and treats 'live' plus 'unresolved' (playoff /
 * suspended / weather) as "play is happening". Live events sort FIRST in the
 * rail. Freshness cadence is driven off that same flag: 60s staleTime and
 * refetch-on-focus while anything is live, today's cadence otherwise, and no
 * timer polling when nothing is live.
 *
 * VERIFY verdicts encoded here:
 *   purse            — present on nearly every event; absent drops the cell.
 *   defending champ  — present on sr_tournaments directly; absent falls back
 *                      to the event format line.
 *   venue -> course  — sr_tournaments.golf_course_id is NULL platform-wide, so
 *                      the catalogue link is resolved by venue name at the
 *                      section level (useCourseImageResolver). Unresolved
 *                      venues carry no media chip and no course routing.
 */

export interface TourWeekEvent {
  id: string;
  name: string;
  tourLabel: string;
  venueName: string;
  venueCourseName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  startDate: string;
  endDate: string;
  par: number | null;
  yardage: number | null;
  purse: number | null;
  defendingChampion: string | null;
  /** True when the event is in play inside the current week. */
  thisWeek: boolean;
  /** Sportradar status, verbatim. */
  status: string | null;
  /** Round Sportradar reports as current; used for the "R2" prefix. */
  currentRound: number | null;
  /** True when getTournamentDisplayState says play is happening. */
  isLive: boolean;
  /** True when the event has FINISHED inside the result window. */
  isResult: boolean;
}

const DAY = 86_400_000;
const TOUR_LABEL: Record<string, string> = {
  pga: 'PGA Tour',
  euro: 'DP World',
  liv: 'LIV',
  lpga: 'LPGA',
  pgad: 'Korn Ferry',
  champ: 'Champions',
};

export function useTourThisWeek(limit = 8) {
  // Liveness is discovered FROM the data, so it is held in state and fed back
  // into the options on the next render (no second query, no duplicate key).
  const [anyLive, setAnyLive] = useState(false);

  const query = useQuery({
    queryKey: ['courseled', 'tour-this-week', limit],

    queryFn: async (): Promise<TourWeekEvent[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const horizon = new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          `id, name, start_date, end_date, venue_name, venue_course_name, venue_city,
           venue_country, venue_par, venue_yardage, purse, defending_champion,
           status, current_round,
           season:sr_seasons(tour_name)`,
        )
        .gte('end_date', today)
        .lte('start_date', horizon)
        .order('start_date', { ascending: true })
        .limit(120);
      if (error) throw error;

      const weekEnd = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10);
      const rows = ((data ?? []) as any[]).filter((r) => r.start_date && r.end_date);

      const mapped: TourWeekEvent[] = rows.map((r) => {
        const slug = mapTourSlug(r.season?.tour_name);
        const state = getTournamentDisplayState(r.status ?? '', r.end_date);
        return {
          id: r.id,
          name: r.name,
          tourLabel: TOUR_LABEL[slug] ?? String(r.season?.tour_name ?? 'Tour'),
          venueName: r.venue_course_name || r.venue_name || r.name,
          venueCourseName: r.venue_course_name ?? null,
          venueCity: r.venue_city ?? null,
          venueCountry: r.venue_country ?? null,
          startDate: r.start_date,
          endDate: r.end_date,
          par: r.venue_par != null ? Number(r.venue_par) : null,
          yardage: r.venue_yardage != null ? Number(r.venue_yardage) : null,
          purse: r.purse != null ? Number(r.purse) : null,
          defendingChampion: r.defending_champion ?? null,
          thisWeek: r.start_date <= weekEnd,
          status: r.status ?? null,
          currentRound: r.current_round != null ? Number(r.current_round) : null,
          isLive: state === 'live' || state === 'unresolved',
          isResult: state === 'result',
        };
      });

      // Live events lead the rail; everything else keeps date order.
      const byLiveThenDate = (a: TourWeekEvent, b: TourWeekEvent) =>
        Number(b.isLive) - Number(a.isLive) || a.startDate.localeCompare(b.startDate);

      const inPlay = mapped.filter((e) => e.thisWeek);
      if (inPlay.length > 0) return inPlay.sort(byLiveThenDate).slice(0, limit);

      // Off-week: the next event per tour, soonest first.
      const perTour = new Map<string, TourWeekEvent>();
      for (const e of mapped) if (!perTour.has(e.tourLabel)) perTour.set(e.tourLabel, e);
      return [...perTour.values()].sort(byLiveThenDate).slice(0, limit);
    },
    // Cadence follows liveness: a moving leaderboard needs a minute-fresh read,
    // an off-week rail does not (and must never poll on a timer).
    staleTime: anyLive ? 60_000 : 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: anyLive,
  });

  const live = (query.data ?? []).some((e) => e.isLive);
  useEffect(() => {
    setAnyLive((prev) => (prev === live ? prev : live));
  }, [live]);

  return query;
}

