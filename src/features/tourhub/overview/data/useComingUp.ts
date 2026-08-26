/**
 * useComingUp — Overview V4 upcoming rail. Next 4 upcoming tournaments
 * for the given tour, including days_away and defending champion. Majors
 * from other tours also surface for 'pga'.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../../_shared/tourOrder';
import { isMajor } from '../../utils/majorScope';
import type { TourId } from '../../hooks/useOverviewData';

const DAY = 86_400_000;

export interface ComingUpRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  purse: number | null;
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
          venue_course_name, venue_name, venue_city, venue_country,
          purse, defending_champion,
          season:sr_seasons(tour_name)
        `)
        .in('status', ['scheduled', 'created'])
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(effectiveLimit * 6);
      if (error) throw error;
      const now = Date.now();
      const rows = ((data as any[]) ?? []).map((r) => {
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
      // Some tours (e.g. LIV) carry no scheduled future events in the feed. The
      // Schedule section must never vanish for that reason — fall back to the
      // merged all-tour list rather than rendering nothing.
      const filtered = scoped.length > 0 ? scoped : rows;

      return filtered.slice(0, effectiveLimit).map(({ r, slug }) => ({
        id: r.id,
        name: r.name,
        start_date: r.start_date,
        end_date: r.end_date,
        purse: r.purse ?? null,
        field_size: null,
        venue: r.venue_course_name || r.venue_name || [r.venue_city, r.venue_country].filter(Boolean).join(', ') || null,
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
