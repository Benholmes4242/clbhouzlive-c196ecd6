/**
 * useHeroCarouselData - Single-winner hero selection
 * 
 * Selection priority (strict order):
 * 1. Live tournament — final round takes priority over early rounds
 * 2. Major championship (upcoming)
 * 3. Most recent completed (with winner)
 * 4. Next upcoming flagship event
 * 
 * Carousel ONLY activates when multiple tours have simultaneous live events.
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
  winnerPgaTourId: string | null;
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
    // Live tournaments (inprogress OR starting-soon: created/scheduled but within date range)
    supabase
      .from('sr_tournaments')
      .select(`
        id, name, status, start_date, end_date,
        venue_name, venue_city, venue_country, venue_par, venue_yardage,
        purse, currency, winner_id,
        season:sr_seasons!inner(tour_name)
      `)
      .or(`status.eq.inprogress,and(status.in.(created,scheduled),start_date.lte.${todayStr},end_date.gte.${todayStr})`)
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
    
    // Upcoming tournaments (future start dates only - exclude those already in "starting soon")
    supabase
      .from('sr_tournaments')
      .select(`
        id, name, status, start_date, end_date,
        venue_name, venue_city, venue_country, venue_par, venue_yardage,
        purse, currency, winner_id,
        season:sr_seasons!inner(tour_name)
      `)
      .in('status', ['scheduled', 'created'])
      .gt('start_date', todayStr)
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
          .select('sr_id, first_name, last_name, photo_url, pga_tour_id')
          .in('sr_id', winnerSrIds)
      : Promise.resolve({ data: [] }),
    allTournamentIds.length > 0
      ? supabase
          .from('sr_leaderboards')
          .select(`
            tournament_id, position, score,
            player:sr_players!inner(sr_id, first_name, last_name, photo_url, pga_tour_id)
          `)
          .in('tournament_id', allTournamentIds)
          .gt('strokes', 0)
          .not('position', 'is', null)
          .eq('position', 1)
      : Promise.resolve({ data: [] }),
  ]);

  // Build winner map from sr_players
  const winnerMap: Record<string, { first_name: string; last_name: string; photo_url: string | null; pga_tour_id: string | null }> = {};
  (winnersResult.data || []).forEach((w: any) => {
    if (w.sr_id) {
      winnerMap[w.sr_id] = {
        first_name: w.first_name || '',
        last_name: w.last_name || '',
        photo_url: w.photo_url,
        pga_tour_id: w.pga_tour_id || null,
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
    let winnerPgaTourId: string | null = null;
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
      winnerPgaTourId = winnerFromId?.pga_tour_id || leaderboardEntry?.player?.pga_tour_id || null;
      
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
      winnerPgaTourId,
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

  // === NEW: Single-winner selection logic ===
  const MAJORS = ['The Masters', 'PGA Championship', 'U.S. Open', 'The Open Championship'];

  // Collect all live tournaments (across tours)
  const allLive: HeroSlide[] = [];
  const allCompleted: HeroSlide[] = [];
  const allUpcoming: HeroSlide[] = [];

  TOUR_PRIORITY.forEach(tour => {
    liveByTour[tour].forEach(t => allLive.push({ tournament: t, type: 'live' }));
    completedByTour[tour].forEach(t => allCompleted.push({ tournament: t, type: 'completed' }));
    upcomingByTour[tour].forEach(t => allUpcoming.push({ tournament: t, type: 'upcoming' }));
  });

  // If multiple tours have simultaneous live events → carousel mode
  const liveToursCount = TOUR_PRIORITY.filter(t => liveByTour[t].length > 0).length;

  if (liveToursCount > 1) {
    // Multi-live carousel: one slide per live tour, sorted by tour priority
    const liveSlides = TOUR_PRIORITY
      .filter(t => liveByTour[t].length > 0)
      .map(t => ({ tournament: liveByTour[t][0], type: 'live' as const }));
    return liveSlides;
  }

  // Single-winner selection
  // 1. Live tournament (prefer final round)
  if (allLive.length > 0) {
    return [allLive[0]];
  }

  // 2. Upcoming major
  const majorUpcoming = allUpcoming.find(s =>
    MAJORS.some(m => s.tournament.name?.includes(m))
  );
  if (majorUpcoming) return [majorUpcoming];

  // 3. Most recent completed
  allCompleted.sort((a, b) =>
    new Date(b.tournament.endDate).getTime() - new Date(a.tournament.endDate).getTime()
  );
  if (allCompleted.length > 0) return [allCompleted[0]];

  // 4. Next upcoming
  allUpcoming.sort((a, b) =>
    new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime()
  );
  if (allUpcoming.length > 0) return [allUpcoming[0]];

  return [];
}

export function useHeroCarouselData() {
  return useQuery({
    queryKey: ['hero-carousel-data'],
    queryFn: fetchHeroData,
    staleTime: 30 * 1000, // 30 seconds for live data
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
