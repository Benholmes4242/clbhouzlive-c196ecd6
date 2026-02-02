/**
 * useSeasonTournaments - Fetches all tournaments for a tour's current season
 * Includes all statuses (scheduled, created, inprogress, closed, complete)
 * With winner data joined for completed tournaments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TourInfo {
  tourKey: string;
  tourName: string;
  count: number;
}

export interface SeasonTournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  purse: number | null;
  venueName: string | null;
  venueCity: string | null;
  venueState: string | null;
  venueCountry: string | null;
  venuePar: number | null;
  venueYardage: number | null;
  tourName: string;
  year: number;
  // Winner info (for closed tournaments)
  winnerId: string | null;
  winnerFirstName: string | null;
  winnerLastName: string | null;
  winnerPhotoUrl: string | null;
}

// Normalized tour key mapping
const TOUR_KEY_MAP: Record<string, string> = {
  'pga': 'PGA Tour',
  'liv': 'LIV Golf',
  'euro': 'DP World Tour',
  'pgad': 'Korn Ferry Tour',
  'champ': 'Champions Tour',
  'lpga': 'LPGA Tour',
};

/**
 * Get available tours with tournament counts for the current year
 */
export function useAvailableTours() {
  return useQuery({
    queryKey: ['available-tours'],
    queryFn: async (): Promise<TourInfo[]> => {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('sr_seasons')
        .select(`
          id,
          tour_name,
          year,
          tournaments:sr_tournaments(id)
        `)
        .eq('year', currentYear);
      
      if (error) throw error;
      
      // Group by normalized tour key and count tournaments
      const tourCounts = new Map<string, { count: number; displayName: string }>();
      
      (data || []).forEach((season: any) => {
        const tourKey = season.tour_name?.toLowerCase() || '';
        const displayName = TOUR_KEY_MAP[tourKey] || season.tour_name || 'Unknown';
        const count = season.tournaments?.length || 0;
        
        if (count > 0) {
          const existing = tourCounts.get(tourKey);
          tourCounts.set(tourKey, {
            count: (existing?.count || 0) + count,
            displayName,
          });
        }
      });
      
      // Convert to array and sort by count (most tournaments first)
      return Array.from(tourCounts.entries())
        .map(([tourKey, { count, displayName }]) => ({
          tourKey,
          tourName: displayName,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch all tournaments for a specific tour in the current year
 * Includes all statuses and winner data for completed events
 */
export function useSeasonTournaments(tourKey: string = 'pga') {
  return useQuery({
    queryKey: ['season-tournaments', tourKey],
    queryFn: async (): Promise<SeasonTournament[]> => {
      const currentYear = new Date().getFullYear();
      
      // First, get the season ID for this tour
      const { data: seasons, error: seasonError } = await supabase
        .from('sr_seasons')
        .select('id, tour_name, year')
        .eq('year', currentYear)
        .ilike('tour_name', tourKey);
      
      if (seasonError) throw seasonError;
      if (!seasons || seasons.length === 0) return [];
      
      const seasonIds = seasons.map(s => s.id);
      
      // Fetch tournaments with winner data
      const { data: tournaments, error: tournamentError } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          purse,
          venue_name,
          venue_city,
          venue_state,
          venue_country,
          venue_par,
          venue_yardage,
          winner_id,
          season:sr_seasons!inner(tour_name, year)
        `)
        .in('season_id', seasonIds)
        .in('status', ['scheduled', 'created', 'inprogress', 'closed', 'complete'])
        .order('start_date', { ascending: true });
      
      if (tournamentError) throw tournamentError;
      if (!tournaments) return [];
      
      // Get winner IDs for completed tournaments
      const winnerIds = tournaments
        .filter(t => t.winner_id)
        .map(t => t.winner_id);
      
      // Fetch winner player data if any
      let winnerMap = new Map<string, { firstName: string; lastName: string; photoUrl: string | null }>();
      
      if (winnerIds.length > 0) {
        const { data: winners } = await supabase
          .from('sr_players')
          .select('id, first_name, last_name, photo_url')
          .in('id', winnerIds);
        
        (winners || []).forEach((w: any) => {
          winnerMap.set(w.id, {
            firstName: w.first_name || '',
            lastName: w.last_name || '',
            photoUrl: w.photo_url,
          });
        });
      }
      
      // Transform to our interface
      return tournaments.map((t: any) => {
        const season = Array.isArray(t.season) ? t.season[0] : t.season;
        const winner = t.winner_id ? winnerMap.get(t.winner_id) : null;
        
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          startDate: t.start_date,
          endDate: t.end_date,
          purse: t.purse,
          venueName: t.venue_name,
          venueCity: t.venue_city,
          venueState: t.venue_state,
          venueCountry: t.venue_country,
          venuePar: t.venue_par,
          venueYardage: t.venue_yardage,
          tourName: season?.tour_name || tourKey,
          year: season?.year || currentYear,
          winnerId: t.winner_id,
          winnerFirstName: winner?.firstName || null,
          winnerLastName: winner?.lastName || null,
          winnerPhotoUrl: winner?.photoUrl || null,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Calculate which page should be shown initially
 * Based on finding the current/next upcoming tournament
 */
export function getInitialPage(tournaments: SeasonTournament[], itemsPerPage: number): number {
  if (!tournaments.length) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find the first tournament that is live or upcoming
  const targetIndex = tournaments.findIndex(t => {
    if (t.status === 'inprogress') return true;
    if (t.status === 'scheduled' || t.status === 'created') {
      return new Date(t.startDate) >= today;
    }
    return false;
  });
  
  if (targetIndex === -1) {
    // All tournaments are complete - show last page
    return Math.max(0, Math.ceil(tournaments.length / itemsPerPage) - 1);
  }
  
  // Return the page containing this tournament
  return Math.floor(targetIndex / itemsPerPage);
}
