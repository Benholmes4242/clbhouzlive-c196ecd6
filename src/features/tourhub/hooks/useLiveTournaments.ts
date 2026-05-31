import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../_shared/tourOrder';
import type { TourId } from './useOverviewData';

export interface LiveTournamentLite {
  id: string;
  name: string;
  status: string;
  start_date: string;
  venue_par: number | null;
  tour_name: string | null;
  tourSlug: TourId;
  purse: number | null;
}

/** Tournaments that are in progress, OR scheduled with start_date === today (local). */
export function useLiveTournaments() {
  return useQuery({
    queryKey: ['tourhub', 'live-tournaments'],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<LiveTournamentLite[]> => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, name, status, start_date, venue_par, purse, season:sr_seasons(tour_name)')
        .or(`status.eq.inprogress,and(status.in.(scheduled,created),start_date.eq.${todayStr})`)
        .order('purse', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('useLiveTournaments', error);
        return [];
      }
      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        start_date: t.start_date,
        venue_par: t.venue_par ?? null,
        tour_name: t.season?.tour_name ?? null,
        tourSlug: mapTourSlug(t.season?.tour_name ?? ''),
        purse: t.purse ?? null,
      }));
    },
  });
}
