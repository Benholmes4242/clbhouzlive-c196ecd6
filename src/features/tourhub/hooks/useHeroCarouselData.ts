/**
 * useHeroCarouselData - Hero carousel data hook (reads from shared tournaments cache)
 * 
 * Logic:
 * For each major tour (PGA, LIV, DP World, LPGA, Korn Ferry, Champions):
 * - Priority 1: LIVE tournament (inprogress)
 * - Priority 2: Recently completed (closed/complete, last 14 days) with winner
 * - Priority 3: Next upcoming (scheduled/created)
 * 
 * Slide ordering:
 * 1. All LIVE (by tour priority, majors first)
 * 2. All COMPLETED (by end_date DESC)
 * 3. All UPCOMING (by start_date ASC)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TOUR_CONFIG, type TourId } from './useOverviewData';
import { useTournamentsCache, type CachedTournament } from '@/hooks/useTournamentsCache';
import { getContextLabel } from '../utils/tournamentClassification';

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
  defendingChampion: string | null;
  defendingChampionPhotoUrl: string | null;
  defendingChampionPgaTourId: string | null;
  isMajor: boolean;
  isSignature: boolean;
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

export function useHeroCarouselData() {
  const { data: cache, isLoading: cacheLoading } = useTournamentsCache();

  return useQuery({
    queryKey: ['hero-carousel-data', cache ? 'ready' : 'waiting'],
    queryFn: async (): Promise<HeroSlide[]> => {
      if (!cache) return [];

      const liveTournaments = cache.live;
      const completedTournaments = cache.completed;
      const upcomingTournaments = cache.upcoming;

      // Collect winner sr_ids and tournament IDs for batch lookups
      const allTournamentIds = [
        ...liveTournaments.map(t => t.id),
        ...completedTournaments.map(t => t.id),
      ];

      const winnerSrIds = completedTournaments
        .map(t => t.winner_id)
        .filter((id): id is string => !!id);

      // Collect defending champion names for upcoming tournaments
      const defendingChampionNames = upcomingTournaments
        .map(t => t.defending_champion)
        .filter((name): name is string => !!name);

      // Fetch winner details, leaderboard data, and defending champion photos in parallel
      const [winnersResult, leaderboardResult, defendingChampionResult] = await Promise.all([
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
        defendingChampionNames.length > 0
          ? supabase
              .from('sr_players')
              .select('sr_id, first_name, last_name, photo_url, pga_tour_id')
              .or(
                defendingChampionNames.map(name => {
                  const parts = name.trim().split(' ');
                  const first = parts[0];
                  const last = parts.slice(1).join(' ');
                  return `and(first_name.ilike.${first},last_name.ilike.${last})`;
                }).join(',')
              )
          : Promise.resolve({ data: [] }),
      ]);

      // Build winner map
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

      // Build defending champion map
      const defendingChampionMap: Record<string, { photo_url: string | null; pga_tour_id: string | null }> = {};
      ((defendingChampionResult as any).data || []).forEach((p: any) => {
        const fullName = `${p.first_name} ${p.last_name}`.trim();
        defendingChampionMap[fullName.toLowerCase()] = {
          photo_url: p.photo_url,
          pga_tour_id: p.pga_tour_id,
        };
      });

      // Helper to transform tournament data
      const transformTournament = (row: CachedTournament, includeWinner: boolean = false): HeroTournament => {
        const tourSlug = mapTourSlug(row.season?.tour_name || '');
        const tourConfig = TOUR_CONFIG[tourSlug];
        const contextLabel = getContextLabel({ name: row.name, tourName: row.season?.tour_name });

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

        // Defending champion photo lookup
        const champKey = (row.defending_champion || '').toLowerCase();
        const champData = defendingChampionMap[champKey] || null;

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
          defendingChampion: row.defending_champion || null,
          defendingChampionPhotoUrl: champData?.photo_url ?? null,
          defendingChampionPgaTourId: champData?.pga_tour_id ?? null,
          isMajor: contextLabel === 'MAJOR CHAMPIONSHIP',
          isSignature: contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES',
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

      TOUR_PRIORITY.forEach(tour => {
        liveByTour[tour] = [];
        completedByTour[tour] = [];
        upcomingByTour[tour] = [];
      });

      liveTournaments.forEach(t => {
        const tournament = transformTournament(t, false);
        if (liveByTour[tournament.tourSlug]) liveByTour[tournament.tourSlug].push(tournament);
      });

      completedTournaments.forEach(t => {
        const tournament = transformTournament(t, true);
        if (completedByTour[tournament.tourSlug]) completedByTour[tournament.tourSlug].push(tournament);
      });

      upcomingTournaments.forEach(t => {
        const tournament = transformTournament(t, false);
        if (upcomingByTour[tournament.tourSlug]) upcomingByTour[tournament.tourSlug].push(tournament);
      });

      // Build slides per tour based on priority logic
      const liveSlides: HeroSlide[] = [];
      const completedSlides: HeroSlide[] = [];
      const upcomingSlides: HeroSlide[] = [];

      TOUR_PRIORITY.forEach(tour => {
        const live = liveByTour[tour];
        const completed = completedByTour[tour];
        const upcoming = upcomingByTour[tour];

        if (live.length > 0) {
          // Sort by purse descending so the biggest event leads; show ALL live events per tour
          const sorted = [...live].sort((a, b) => (b.purse || 0) - (a.purse || 0));
          for (const tournament of sorted) {
            liveSlides.push({ tournament, type: 'live' });
          }
        } else if (completed.length > 0) {
          completedSlides.push({ tournament: completed[0], type: 'completed' });
        } else if (upcoming.length > 0) {
          upcomingSlides.push({ tournament: upcoming[0], type: 'upcoming' });
        }
      });

      // Sort within categories — majors first within live
      liveSlides.sort((a, b) => {
        if (a.tournament.isMajor !== b.tournament.isMajor) return a.tournament.isMajor ? -1 : 1;
        return TOUR_PRIORITY.indexOf(a.tournament.tourSlug) - TOUR_PRIORITY.indexOf(b.tournament.tourSlug);
      });
      completedSlides.sort((a, b) => {
        const dateDiff = new Date(b.tournament.endDate).getTime() - new Date(a.tournament.endDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.tournament.purse || 0) - (a.tournament.purse || 0);
      });
      upcomingSlides.sort((a, b) => new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime());

      // Per-category caps to prevent any one category from crowding out others
      const cappedLive = liveSlides.slice(0, 6);
      const cappedCompleted = completedSlides.slice(0, 4);
      const cappedUpcoming = upcomingSlides.slice(0, 3);

      // ── DEV PREVIEW: Hardcoded upcoming slide for UI review — REMOVE BEFORE RELEASE ──
      const devUpcomingSlide: HeroSlide = {
        type: 'upcoming',
        tournament: {
          id: 'dev-valero-2025',
          name: 'Valero Texas Open',
          status: 'scheduled',
          startDate: '2025-03-27',
          endDate: '2025-03-30',
          venueName: 'TPC San Antonio',
          venueCity: 'San Antonio',
          venueCountry: 'USA',
          venuePar: 72,
          venueYardage: 7494,
          purse: 9200000,
          currency: 'USD',
          tourSlug: 'pga',
          tourName: 'PGA Tour',
          defendingChampion: 'Akshay Bhatia',
          defendingChampionPhotoUrl: null,
          defendingChampionPgaTourId: null,
          isMajor: false,
          isSignature: false,
          winnerId: null,
          winnerName: null,
          winnerPhotoUrl: null,
          winnerPgaTourId: null,
          winnerScore: null,
        },
      };

      return [devUpcomingSlide, ...cappedLive, ...cappedCompleted, ...cappedUpcoming];
    },
    enabled: !!cache,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
