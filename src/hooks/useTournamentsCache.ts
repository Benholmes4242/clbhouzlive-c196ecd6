/**
 * useTournamentsCache — Single shared cache for sr_tournaments data.
 * 
 * Replaces 13–18 independent sr_tournaments queries with 3 parallel queries.
 * Consumer hooks read from this cache via select transforms.
 * 
 * Coverage:
 * - Live/starting-soon tournaments
 * - Recently completed (last 3 days — covers Sun→Tue/Wed viewing window)
 * - Upcoming (next 14 days, limit 20)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Union of all fields needed by any consumer hook
const CACHE_SELECT = `
  id, name, status, start_date, end_date, purse, currency,
  venue_id, venue_name, venue_city, venue_country, venue_par, venue_yardage,
  winner_id, defending_champion, champion_narrative, season_id,
  season:sr_seasons!inner(id, tour_id, tour_name, year)
`;

export interface CachedTournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  purse: number | null;
  currency: string | null;
  venue_id: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  winner_id: string | null;
  defending_champion: string | null;
  champion_narrative: string | null;
  season_id: string | null;
  season: {
    id: string;
    tour_id: string;
    tour_name: string;
    year: number;
  };
}

export interface TournamentsCache {
  live: CachedTournament[];
  completed: CachedTournament[];
  upcoming: CachedTournament[];
  /** All three combined for convenience */
  all: CachedTournament[];
}

async function fetchTournamentsCache(): Promise<TournamentsCache> {
  const today = new Date().toISOString().split('T')[0];
  // Rail + Hero results window — 3d covers Sun→Tue/Wed viewing rhythm.
  // Single consumer of cache.completed (useHeroCarouselData) is robust to a
  // wider window: it picks most-recent-per-tour and caps at 6 slides.
  const resultsWindowAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  const [liveRes, completedRes, upcomingRes] = await Promise.all([
    // Live + starting soon
    supabase
      .from('sr_tournaments')
      .select(CACHE_SELECT)
      .eq('status', 'inprogress')
      .order('start_date', { ascending: true })
      .order('purse', { ascending: false }),

    // Completed in last 3 days
    supabase
      .from('sr_tournaments')
      .select(CACHE_SELECT)
      .in('status', ['closed', 'complete'])
      .gte('end_date', resultsWindowAgo)
      .order('end_date', { ascending: false })
      .order('purse', { ascending: false }),

    // Upcoming (broader window for coverage)
    supabase
      .from('sr_tournaments')
      .select(CACHE_SELECT)
      .in('status', ['scheduled', 'created'])
      .gt('start_date', today)
      .order('start_date', { ascending: true })
      .order('purse', { ascending: false })
      .limit(100),
  ]);

  if (liveRes.error) throw liveRes.error;
  if (completedRes.error) throw completedRes.error;
  if (upcomingRes.error) throw upcomingRes.error;

  const live = (liveRes.data || []) as unknown as CachedTournament[];
  const completed = (completedRes.data || []) as unknown as CachedTournament[];
  const upcoming = (upcomingRes.data || []) as unknown as CachedTournament[];

  return {
    live,
    completed,
    upcoming,
    all: [...live, ...completed, ...upcoming],
  };
}

export function useTournamentsCache() {
  return useQuery({
    queryKey: ['tournaments-cache'],
    queryFn: fetchTournamentsCache,
    staleTime: 30_000,        // 30s — matches live sync interval
    refetchInterval: 60_000,  // 1min polling fallback
    refetchOnWindowFocus: true,
  });
}
