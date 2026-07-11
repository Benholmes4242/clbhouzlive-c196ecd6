/**
 * useTourEventContext — Overview V4 core resolver.
 *
 * Given a tour slug, resolves the currently-relevant tournament + display
 * state from sr_tournaments (joined to sr_seasons.tour_full_name), plus a
 * next-major countdown for quiet weeks.
 *
 * Rules:
 *   selection: dated-current (now within [start_date - 3d, end_date + 1d])
 *              else next upcoming; else most recent completed.
 *   state:     live / upcoming / completed
 *   isMajor:   uses shared majorScope util.
 *   nextMajor: next upcoming major on ANY tour (majors are cross-tour).
 *
 * ZERO imports from overview/, overview-v2/, overview-v3/ or their hooks.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../../_shared/tourOrder';
import { isAnyMajor, isMajor } from '../../utils/majorScope';
import type { TourId } from '../../hooks/useOverviewData';

const DAY = 86_400_000;
const CURRENT_LEAD_MS = 3 * DAY;
const CURRENT_TAIL_MS = 1 * DAY;

export type EventState = 'live' | 'upcoming' | 'completed';

export interface TourEventContextRow {
  id: string;
  sr_id: string | null;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_course_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  purse: number | null;
  currency: string | null;
  defending_champion: string | null;
  tour_slug: TourId;
  tour_full_name: string | null;
}

export interface NextMajor {
  id: string;
  name: string;
  venue: string | null;
  start_date: string;
  days_away: number;
  tour_slug: TourId;
}

export interface TourEventContext {
  tour: TourId;
  event: TourEventContextRow | null;
  state: EventState;
  isMajor: boolean;
  nextMajor: NextMajor | null;
}

interface Row {
  id: string;
  sr_id: string | null;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_course_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  purse: number | null;
  currency: string | null;
  defending_champion: string | null;
  season: { tour_name: string | null; tour_full_name: string | null } | null;
}

function toEventRow(r: Row): TourEventContextRow {
  return {
    id: r.id,
    sr_id: r.sr_id,
    name: r.name,
    status: r.status,
    start_date: r.start_date,
    end_date: r.end_date,
    venue_name: r.venue_name,
    venue_course_name: r.venue_course_name,
    venue_city: r.venue_city,
    venue_state: r.venue_state,
    venue_country: r.venue_country,
    venue_par: r.venue_par,
    venue_yardage: r.venue_yardage,
    purse: r.purse,
    currency: r.currency,
    defending_champion: r.defending_champion,
    tour_slug: mapTourSlug(r.season?.tour_name ?? r.season?.tour_full_name),
    tour_full_name: r.season?.tour_full_name ?? null,
  };
}

function pickEvent(rows: Row[], tour: TourId): { event: TourEventContextRow | null; state: EventState } {
  const now = Date.now();
  const forTour = rows
    .map(toEventRow)
    .filter((r) => {
      if (r.tour_slug === tour) return true;
      // Majors cross tours (Masters etc appear under EURO season) — allow
      // them to surface for pga only.
      if (tour === 'pga' && isMajor(r.name)) return true;
      return false;
    });

  // Dated-current
  const current = forTour.find((r) => {
    const start = new Date(r.start_date).getTime();
    const end = new Date(r.end_date).getTime();
    return now >= start - CURRENT_LEAD_MS && now <= end + CURRENT_TAIL_MS;
  });
  if (current) {
    const s = (current.status || '').toLowerCase();
    const state: EventState = s === 'inprogress' || s === 'in_progress' ? 'live' : now < new Date(current.start_date).getTime() ? 'upcoming' : 'completed';
    return { event: current, state };
  }

  // Next upcoming
  const upcoming = forTour
    .filter((r) => new Date(r.start_date).getTime() > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  if (upcoming.length) return { event: upcoming[0], state: 'upcoming' };

  // Most recent completed
  const completed = forTour
    .filter((r) => new Date(r.end_date).getTime() < now)
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  if (completed.length) return { event: completed[0], state: 'completed' };

  return { event: null, state: 'upcoming' };
}

function findNextMajor(rows: Row[], tour: TourId): NextMajor | null {
  const now = Date.now();
  const majors = rows
    .map(toEventRow)
    .filter((r) => isAnyMajor(r.name))
    .filter((r) => new Date(r.start_date).getTime() > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const pick = majors[0];
  if (!pick) return null;
  const startMs = new Date(pick.start_date).getTime();
  const days = Math.max(0, Math.ceil((startMs - now) / DAY));
  return {
    id: pick.id,
    name: pick.name,
    venue: pick.venue_course_name || pick.venue_name,
    start_date: pick.start_date,
    days_away: days,
    tour_slug: pick.tour_slug || tour,
  };
}

export function useTourEventContext(tour: TourId) {
  return useQuery({
    queryKey: ['overview-v4', 'event-context', tour],
    queryFn: async (): Promise<TourEventContext> => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id, sr_id, name, status, start_date, end_date,
          venue_name, venue_course_name, venue_city, venue_state, venue_country,
          venue_par, venue_yardage, purse, currency, defending_champion,
          season:sr_seasons(tour_name, tour_full_name)
        `)
        .order('start_date', { ascending: true });
      if (error) throw error;
      const rows = (data as unknown as Row[]) ?? [];
      const { event, state } = pickEvent(rows, tour);
      return {
        tour,
        event,
        state,
        isMajor: event ? isAnyMajor(event.name) : false,
        nextMajor: findNextMajor(rows, tour),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
  });
}
