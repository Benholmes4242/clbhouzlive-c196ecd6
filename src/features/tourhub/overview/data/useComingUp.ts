/**
 * useComingUp — Overview upcoming selection. One event-catalogue read;
 * for the given tour, including days_away and defending champion. Majors
 * from other tours also surface for 'pga'.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../../_shared/tourOrder';
import { isRetiredTour } from '../../constants/tourMap';
import { isMajor } from '../../utils/majorScope';
import type { TourId } from '../../hooks/useOverviewData';
import { formatVenueLabel } from '../../lib/venueLabel';
import { compareComingUpEvents } from '../sections/overviewEventSelection';

const DAY = 86_400_000;

export interface ComingUpRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  purse: number | null;
  winning_share?: number | null;
  venue_par?: number | null;
  venue_yardage?: number | null;
  event_type?: string | null;
  golf_course_id?: string | null;
  currency?: string | null;
  venue_name?: string | null;
  venue_course_name?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_country?: string | null;
  /**
   * FIELD SIZE HAS NO SOURCE IN THE FEED. sr_tournaments carries no field/entry
   * count and raw_data has no such key on scheduled events, so this is always
   * null today and the row's FIELD column collapses. Declared rather than
   * omitted so the figure lights up the day the feed carries it.
   */
  field_size: number | null;
  days_away: number;
  defending_champion: string | null;
  isMajor: boolean;
  isPlayoff: boolean;
  tour_slug: TourId;
}

function isPlayoffName(name: string): boolean {
  const l = name.toLowerCase();
  return l.includes('playoff') || l.includes('fedex st') || l.includes('tour championship');
}

export function useComingUp(tour: TourId | null, limit = 12) {
  const effectiveLimit = Math.max(limit, 12);
  return useQuery({
    queryKey: ['overview', 'coming-up', tour ?? 'all', effectiveLimit],
    queryFn: async (): Promise<ComingUpRow[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id, name, start_date, end_date,
          venue_course_name, venue_name, venue_city, venue_state, venue_country,
          purse, winning_share, venue_par, venue_yardage, event_type, golf_course_id, currency, defending_champion,
          season:sr_seasons(tour_name)
        `)
        .in('status', ['scheduled', 'created'])
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(effectiveLimit * 6);
      if (error) throw error;
      const now = Date.now();
      const rows = ((data as any[]) ?? []).filter(r => !isRetiredTour(r.season?.tour_name)).map((r) => {
        const slug = mapTourSlug(r.season?.tour_name);
        return { r, slug };
      });
      const scoped = tour === null
        ? rows
        : rows.filter(({ r, slug }) => {
            if (slug === tour) return true;
            if (tour === 'pga' && isMajor(r.name)) return true;
            return false;
          });
      return scoped.sort((a, b) => compareComingUpEvents({ ...a.r, tour_slug: a.slug }, { ...b.r, tour_slug: b.slug })).slice(0, effectiveLimit).map(({ r, slug }) => ({
        id: r.id,
        name: r.name,
        start_date: r.start_date,
        end_date: r.end_date,
        purse: r.purse ?? null,
        winning_share: r.winning_share ?? null,
        venue_par: r.venue_par ?? null,
        venue_yardage: r.venue_yardage ?? null,
        event_type: r.event_type ?? null,
        golf_course_id: r.golf_course_id ?? null,
        currency: r.currency ?? null,
        venue_name: r.venue_name ?? null,
        venue_course_name: r.venue_course_name ?? null,
        venue_city: r.venue_city ?? null,
        venue_state: r.venue_state ?? null,
        venue_country: r.venue_country ?? null,
        field_size: null,
        // CLUB FIRST, COURSE AFTER (see venueLabel.ts). Was course-first, which
        // rendered "Course No. 3" with no club for Presidents Cup.
        venue: [formatVenueLabel(r.venue_name, r.venue_course_name), [r.venue_city, r.venue_state || r.venue_country].filter(Boolean).join(', ')].filter(Boolean).filter((part, index, parts) => index === 0 || part?.toLowerCase() !== parts[index - 1]?.toLowerCase()).join(' · ') || null,
        days_away: Math.max(0, Math.ceil((new Date(r.start_date).getTime() - now) / DAY)),
        defending_champion: r.defending_champion ?? null,
        isMajor: isMajor(r.name),
        isPlayoff: isPlayoffName(r.name),
        tour_slug: slug,
      }));
    },
    staleTime: 60 * 60 * 1000,
  });
}
