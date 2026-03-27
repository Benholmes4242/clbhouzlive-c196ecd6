/**
 * useTournamentSchedule - Fetches upcoming tournaments from sr_tournaments table
 * Provides paginated tournament data with special badges for Majors, Signature events, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledTournament {
  id: string;
  name: string;
  venueName: string;
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  purse: string;
  purseFormatted: string;
  status: string;
  tourName: string;
  year: number;
  par: number | null;
  yardage: number | null;
  isSignature: boolean;
  isMajor: boolean;
  isPlayersChampionship: boolean;
  daysUntil: number;
  dateDisplay: string;
  dateRange: string;
}

interface UseTournamentScheduleOptions {
  tourFilter?: string;
  limit?: number;
  includeInProgress?: boolean;
}

// Major championships detection keywords
const MAJORS = ['masters', 'pga championship', 'u.s. open', 'open championship', 'the open'];

// Signature events (require $20M+ purse)
const SIGNATURE_EVENTS = [
  'genesis invitational',
  'arnold palmer invitational',
  'memorial tournament',
  'travelers championship',
  'scottish open',
  'fedex st. jude',
];

export function useTournamentSchedule(options: UseTournamentScheduleOptions = {}) {
  const { tourFilter, limit, includeInProgress = false } = options;

  return useQuery({
    queryKey: ['tournament-schedule', tourFilter, limit, includeInProgress],
    queryFn: async (): Promise<ScheduledTournament[]> => {
      let query = supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          venue_name,
          city,
          state,
          country,
          start_date,
          end_date,
          purse,
          status,
          raw_data,
          season:sr_seasons!inner(tour_name, year)
        `)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      // Filter by status
      if (includeInProgress) {
        query = query.in('status', ['scheduled', 'inprogress']);
      } else {
        query = query.eq('status', 'scheduled');
      }

      // Filter by tour if specified
      if (tourFilter) {
        query = query.ilike('season.tour_name', `%${tourFilter}%`);
      }

      // Apply limit if specified
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return (data ?? []).map((tournament: any) => {
        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);
        const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Format purse
        const purseRaw = tournament.purse ?? '0';
        const purseNum = parseFloat(String(purseRaw).replace(/[^0-9.]/g, ''));
        const purseFormatted = purseNum >= 1000000
          ? `$${(purseNum / 1000000).toFixed(1)}M`
          : purseNum >= 1000
            ? `$${(purseNum / 1000).toFixed(0)}K`
            : `$${purseNum}`;

        // Format dates
        const dateDisplay = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        // Detect special tournaments
        const nameLower = tournament.name.toLowerCase();
        const isMajor = MAJORS.some(m => nameLower.includes(m));
        const isPlayersChampionship = nameLower.includes('players');
        const isSignature = SIGNATURE_EVENTS.some(s => nameLower.includes(s)) && purseNum >= 20000000;

        // Major override — Sportradar stores Grand Slams under EURO season
        const rawTourName = seasonData?.tour_name ?? 'PGA Tour';
        const isMiscodedMajor = isMajor && rawTourName.toLowerCase() !== 'pga' && !nameLower.includes('senior') && !nameLower.includes('women');
        const effectiveTourName = isMiscodedMajor ? 'pga' : rawTourName;

        // Course details from raw_data
        const rawData = tournament.raw_data as Record<string, any> | null;
        const courseData = rawData?.venue?.courses?.[0] ?? {};

        // Handle season data (can be array or object depending on query)
        const seasonData = Array.isArray(tournament.season) ? tournament.season[0] : tournament.season;

        return {
          id: tournament.id,
          name: tournament.name,
          venueName: tournament.venue_name ?? 'TBD',
          location: [tournament.city, tournament.state, tournament.country].filter(Boolean).join(', '),
          city: tournament.city ?? '',
          state: tournament.state ?? '',
          country: tournament.country ?? '',
          startDate: tournament.start_date,
          endDate: tournament.end_date,
          purse: purseRaw,
          purseFormatted,
          status: tournament.status,
          tourName: effectiveTourName,
          year: seasonData?.year ?? new Date().getFullYear(),
          par: courseData.par ?? null,
          yardage: courseData.yardage ?? null,
          isSignature,
          isMajor,
          isPlayersChampionship,
          daysUntil,
          dateDisplay,
          dateRange,
        };
      });
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Convenience hook for upcoming tournaments only
export function useUpcomingTournaments(limit = 50) {
  return useTournamentSchedule({ limit });
}

// Hook for full season schedule
export function useSeasonSchedule(tourFilter?: string) {
  return useTournamentSchedule({ tourFilter, limit: 100 });
}
