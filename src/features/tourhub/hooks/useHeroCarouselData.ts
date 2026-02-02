/**
 * useHeroCarouselData - Comprehensive hero carousel data hook
 * 
 * Logic:
 * For each major tour (PGA, LIV, DP World, LPGA, Korn Ferry, Champions):
 * - Priority 1: LIVE tournament (inprogress)
 * - Priority 2: Recently completed (closed/complete, last 7 days) with winner
 * - Priority 3: Next upcoming (scheduled/created)
 * 
 * Slide ordering:
 * 1. All LIVE (by tour priority)
 * 2. All COMPLETED (by end_date DESC)
 * 3. All UPCOMING (by start_date ASC)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TOUR_CONFIG, type TourId } from './useOverviewData';

// Tour priority order for sorting live tournaments
const TOUR_PRIORITY: TourId[] = ['pga', 'liv', 'euro', 'lpga', 'pgad', 'champ'];

export interface HeroTournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  venuePar: number | null;
  venueYardage: number | null;
  purse: number | null;
  currency: string | null;
  tourSlug: TourId;
  tourName: string;
  // Winner info (for completed)
  winnerId: string | null;
  winnerName: string | null;
  winnerPhotoUrl: string | null;
  winnerScore: string | null;
}

export interface HeroSlide {
  tournament: HeroTournament;
  type: 'live' | 'completed' | 'upcoming';
}

function mapTourSlug(tourName: string): TourId {
  const normalized = tourName?.toLowerCase().trim();
  if (normalized === 'pga' || normalized === 'pga tour') return 'pga';
  if (normalized === 'euro' || normalized === 'dp world' || normalized === 'european tour') return 'euro';
  if (normalized === 'lpga' || normalized === 'lpga tour') return 'lpga';
  if (normalized === 'liv' || normalized === 'liv golf') return 'liv';
  if (normalized === 'pgad' || normalized === 'korn ferry') return 'pgad';
  if (normalized === 'champ' || normalized === 'champions') return 'champ';
  return 'pga';
}

async function fetchHeroData(): Promise<HeroSlide[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Fetch all relevant tournaments in parallel
  const [liveResult, completedResult, upcomingResult] = await Promise.all([
    // Live tournaments
    supabase
      .from('sr_tournaments')
      .select(`
        id, name, status, start_date, end_date,
        venue_name, venue_city, venue_country, venue_par, venue_yardage,
        purse, currency, winner_id,
        season:sr_seasons!inner(tour_name)
      `)
      .eq('status', 'inprogress')
      .order('start_date', { ascending: true }),
    
    // Recently completed (last 7 days)
    supabase
      .from('sr_tournaments')
      .select(`
        id, name, status, start_date, end_date,
        venue_name, venue_city, venue_country, venue_par, venue_yardage,
        purse, currency, winner_id,
        season:sr_seasons!inner(tour_name)
      `)
      .in('status', ['closed', 'complete'])
      .gte('end_date', sevenDaysAgoStr)
      .order('end_date', { ascending: false }),
    
    // Upcoming tournaments
    supabase
      .from('sr_tournaments')
      .select(`
        id, name, status, start_date, end_date,
        venue_name, venue_city, venue_country, venue_par, venue_yardage,
        purse, currency, winner_id,
        season:sr_seasons!inner(tour_name)
      `)
      .in('status', ['scheduled', 'created'])
      .gte('start_date', todayStr)
      .order('start_date', { ascending: true }),
  ]);

  if (liveResult.error) throw liveResult.error;
  if (completedResult.error) throw completedResult.error;
  if (upcomingResult.error) throw upcomingResult.error;

  const liveTournaments = liveResult.data || [];
  const completedTournaments = completedResult.data || [];
  const upcomingTournaments = upcomingResult.data || [];

  // Collect all tournament IDs and winner sr_ids for batch lookups
  const allTournamentIds = [
    ...liveTournaments.map(t => t.id),
    ...completedTournaments.map(t => t.id),
  ];
  
  const winnerSrIds = completedTournaments
    .map(t => t.winner_id)
    .filter((id): id is string => !!id);

  // Fetch winner details and leaderboard data in parallel
  const [winnersResult, leaderboardResult] = await Promise.all([
    winnerSrIds.length > 0
      ? supabase
          .from('sr_players')
          .select('sr_id, first_name, last_name, photo_url')
          .in('sr_id', winnerSrIds)
      : Promise.resolve({ data: [] }),
    allTournamentIds.length > 0
      ? supabase
          .from('sr_leaderboards')
          .select(`
            tournament_id, position, score,
            player:sr_players!inner(sr_id, first_name, last_name, photo_url)
          `)
          .in('tournament_id', allTournamentIds)
          .eq('position', 1)
      : Promise.resolve({ data: [] }),
  ]);

  // Build winner map from sr_players
  const winnerMap: Record<string, { first_name: string; last_name: string; photo_url: string | null }> = {};
  (winnersResult.data || []).forEach((w: any) => {
    if (w.sr_id) {
      winnerMap[w.sr_id] = {
        first_name: w.first_name || '',
        last_name: w.last_name || '',
        photo_url: w.photo_url,
      };
    }
  });

  // Build leaderboard map
  const leaderboardMap: Record<string, { score: number | null; player: any }> = {};
  (leaderboardResult.data || []).forEach((entry: any) => {
    if (entry.player) {
      leaderboardMap[entry.tournament_id] = {
        score: entry.score,
        player: entry.player,
      };
    }
  });

  // Helper to transform tournament data
  const transformTournament = (row: any, includeWinner: boolean = false): HeroTournament => {
    const tourSlug = mapTourSlug(row.season?.tour_name || '');
    const tourConfig = TOUR_CONFIG[tourSlug];
    
    let winnerName: string | null = null;
    let winnerPhotoUrl: string | null = null;
    let winnerScore: string | null = null;

    if (includeWinner) {
      const winnerFromId = row.winner_id ? winnerMap[row.winner_id] : null;
      const leaderboardEntry = leaderboardMap[row.id];
      
      winnerName = winnerFromId
        ? `${winnerFromId.first_name} ${winnerFromId.last_name}`.trim()
        : leaderboardEntry?.player
          ? `${leaderboardEntry.player.first_name} ${leaderboardEntry.player.last_name}`.trim()
          : null;
      
      winnerPhotoUrl = winnerFromId?.photo_url || leaderboardEntry?.player?.photo_url || null;
      
      winnerScore = leaderboardEntry?.score != null
        ? (leaderboardEntry.score <= 0 ? String(leaderboardEntry.score) : `+${leaderboardEntry.score}`)
        : null;
    }

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      venueName: row.venue_name,
      venueCity: row.venue_city,
      venueCountry: row.venue_country,
      venuePar: row.venue_par,
      venueYardage: row.venue_yardage,
      purse: row.purse,
      currency: row.currency,
      tourSlug,
      tourName: tourConfig?.name || 'PGA Tour',
      winnerId: row.winner_id,
      winnerName,
      winnerPhotoUrl,
      winnerScore,
    };
  };

  // Group tournaments by tour
  const liveByTour: Record<TourId, HeroTournament[]> = {} as any;
  const completedByTour: Record<TourId, HeroTournament[]> = {} as any;
  const upcomingByTour: Record<TourId, HeroTournament[]> = {} as any;

  // Initialize empty arrays for each tour
  TOUR_PRIORITY.forEach(tour => {
    liveByTour[tour] = [];
    completedByTour[tour] = [];
    upcomingByTour[tour] = [];
  });

  // Populate live tournaments
  liveTournaments.forEach(t => {
    const tournament = transformTournament(t, false);
    if (liveByTour[tournament.tourSlug]) {
      liveByTour[tournament.tourSlug].push(tournament);
    }
  });

  // Populate completed tournaments
  completedTournaments.forEach(t => {
    const tournament = transformTournament(t, true);
    if (completedByTour[tournament.tourSlug]) {
      completedByTour[tournament.tourSlug].push(tournament);
    }
  });

  // Populate upcoming tournaments
  upcomingTournaments.forEach(t => {
    const tournament = transformTournament(t, false);
    if (upcomingByTour[tournament.tourSlug]) {
      upcomingByTour[tournament.tourSlug].push(tournament);
    }
  });

  // Build slides per tour based on priority logic
  const liveSlides: HeroSlide[] = [];
  const completedSlides: HeroSlide[] = [];
  const upcomingSlides: HeroSlide[] = [];
  const processedTours = new Set<TourId>();

  // For each tour, pick ONE primary slide based on priority
  TOUR_PRIORITY.forEach(tour => {
    const live = liveByTour[tour];
    const completed = completedByTour[tour];
    const upcoming = upcomingByTour[tour];

    if (live.length > 0) {
      // Priority 1: Live - show the first live tournament for this tour
      liveSlides.push({ tournament: live[0], type: 'live' });
      processedTours.add(tour);
    } else if (completed.length > 0) {
      // Priority 2: Recently completed (only if no live for this tour)
      completedSlides.push({ tournament: completed[0], type: 'completed' });
      processedTours.add(tour);
    } else if (upcoming.length > 0) {
      // Priority 3: Upcoming (only if no live and no completed for this tour)
      upcomingSlides.push({ tournament: upcoming[0], type: 'upcoming' });
      processedTours.add(tour);
    }
  });

  // Sort slides within each category
  // Live: by tour priority
  liveSlides.sort((a, b) => {
    return TOUR_PRIORITY.indexOf(a.tournament.tourSlug) - TOUR_PRIORITY.indexOf(b.tournament.tourSlug);
  });

  // Completed: by end_date DESC (most recently finished first)
  completedSlides.sort((a, b) => {
    return new Date(b.tournament.endDate).getTime() - new Date(a.tournament.endDate).getTime();
  });

  // Upcoming: by start_date ASC (soonest first)
  upcomingSlides.sort((a, b) => {
    return new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime();
  });

  // Combine in priority order: LIVE > COMPLETED > UPCOMING
  const allSlides = [...liveSlides, ...completedSlides, ...upcomingSlides];

  // Cap at 8 slides maximum
  return allSlides.slice(0, 8);
}

export function useHeroCarouselData() {
  return useQuery({
    queryKey: ['hero-carousel-data'],
    queryFn: fetchHeroData,
    staleTime: 30 * 1000, // 30 seconds for live data
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
