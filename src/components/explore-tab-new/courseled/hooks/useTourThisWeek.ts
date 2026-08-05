import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '@/features/tourhub/_shared/tourOrder';

/**
 * useTourThisWeek — one card per venue playing THIS WEEK across the tours
 * (BRIEF, section 3). Reads the same sr_tournaments source the Tour Hub
 * overview reads; no new ingestion.
 *
 * If nothing is in play this week, the NEXT upcoming event per tour surfaces
 * instead and the when-chip carries the date rather than the play days.
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
  return useQuery({
    queryKey: ['courseled', 'tour-this-week', limit],
    queryFn: async (): Promise<TourWeekEvent[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const horizon = new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(
          `id, name, start_date, end_date, venue_name, venue_course_name, venue_city,
           venue_country, venue_par, venue_yardage, purse, defending_champion,
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
        };
      });

      const inPlay = mapped.filter((e) => e.thisWeek);
      if (inPlay.length > 0) return inPlay.slice(0, limit);

      // Off-week: the next event per tour, soonest first.
      const perTour = new Map<string, TourWeekEvent>();
      for (const e of mapped) if (!perTour.has(e.tourLabel)) perTour.set(e.tourLabel, e);
      return [...perTour.values()].slice(0, limit);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
