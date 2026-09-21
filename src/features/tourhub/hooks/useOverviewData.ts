/**
 * useOverviewData - Comprehensive data hooks for Tour Hub Overview
 * Fetches real data from sr_world_rankings, sr_tournaments, sr_seasons
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveBoardEntity, resolveChampionEntry, teamNamesNeedInitials } from '../_shared/boardEntity';
import type { BoardEntry } from '../leaderboard/BoardTable';

// Tour configuration with colors and icons
export const TOUR_CONFIG = {
  pga: { name: 'PGA Tour', color: '#003366', emoji: '🇺🇸', slug: 'pga' },
  euro: { name: 'DP World Tour', color: '#6B21A8', emoji: '🌍', slug: 'euro' },
  lpga: { name: 'LPGA Tour', color: '#E91E63', emoji: '👩', slug: 'lpga' },
  liv: { name: 'LIV Golf', color: '#DC2626', emoji: '⚡', slug: 'liv' },
  pgad: { name: 'Korn Ferry Tour', color: '#059669', emoji: '🌱', slug: 'pgad' },
  champ: { name: 'Champions Tour', color: '#D97706', emoji: '🏆', slug: 'champ' },
} as const;

export type TourId = keyof typeof TOUR_CONFIG;

export interface WorldRankedPlayer {
  playerId: string;
  rank: number;
  avgPoints: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
}

export interface TourTournament {
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
  winningShare: number | null;
  currency: string | null;
  defendingChampion: string | null;
  tourId: string;
  tourName: string;
  tourSlug: TourId;
}

export interface TourStats {
  tourId: string;
  tourName: string;
  tourSlug: TourId;
  tournamentCount: number;
  liveCount: number;
  upcomingCount: number;
  completedCount: number;
  nextTournament: TourTournament | null;
}

export interface OverviewStats {
  rankedPlayers: number;
  totalPlayers: number;
  totalTournaments: number;
  uniqueCourses: number;
  worldNo1: WorldRankedPlayer | null;
  liveTournaments: number;
}

/**
 * Fetch world rankings from sr_world_rankings table
 */
export function useWorldRankingsTop(limit: number = 10) {
  return useQuery({
    queryKey: ['overview-world-rankings', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select(`
          rank,
          avg_points,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            full_name,
            country,
            country_code,
            photo_url
          )
        `)
        .gte('rank', 1)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any): WorldRankedPlayer => ({
        playerId: row.player.id,
        rank: row.rank,
        avgPoints: row.avg_points,
        firstName: row.player.first_name,
        lastName: row.player.last_name,
        fullName: row.player.full_name || `${row.player.first_name} ${row.player.last_name}`,
        country: row.player.country,
        countryCode: row.player.country_code,
        photoUrl: row.player.photo_url,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Map tour_name from database to our TourId
 */
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


/**
 * Fetch upcoming tournaments (next 14 days) across all tours
 */
export function useUpcomingTournaments(days: number = 14) {
  return useQuery({
    queryKey: ['overview-upcoming-tournaments', days],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          venue_name,
          venue_city,
          venue_country,
          venue_par,
          venue_yardage,
          winning_share,
          purse,
          currency,
          defending_champion,
          season:sr_seasons!inner(
            tour_id,
            tour_name
          )
        `)
        .in('event_type', ['stroke', 'team'])
        .in('status', ['scheduled', 'created'])
        .gte('start_date', today)
        .lte('start_date', futureDateStr)
        .order('start_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any): TourTournament => ({
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
        winningShare: row.winning_share,
        purse: row.purse,
        currency: row.currency,
        defendingChampion: row.defending_champion,
        tourId: row.season.tour_id,
        tourName: row.season.tour_name,
        tourSlug: mapTourSlug(row.season.tour_name),
      }));
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Tournament with winner info for hero carousel
 */
export interface TourTournamentWithWinner extends TourTournament {
  winnerId: string | null;
  winnerName: string | null;
  winnerPhotoUrl: string | null;
  winnerScore: string | null;
}

/**
 * Fetch recently closed tournaments (last 48 hours) with winner info for hero
 */
export function useRecentlyCompletedTournaments() {
  return useQuery({
    queryKey: ['overview-recently-completed-tournaments'],
    queryFn: async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch tournaments first
      const { data: tournaments, error } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          venue_name,
          venue_city,
          venue_country,
          venue_par,
          venue_yardage,
          winning_share,
          purse,
          currency,
          defending_champion,
          winner_id,
          event_type,
          season:sr_seasons!inner(
            tour_id,
            tour_name
          )
        `)
        .in('event_type', ['stroke', 'team'])
        .in('status', ['closed', 'complete'])
        .gte('end_date', twoDaysAgoStr)
        .lte('end_date', todayStr)
        .order('end_date', { ascending: false })
        .order('purse', { ascending: false });

      if (error) throw error;
      if (!tournaments?.length) return [];

      // Get tournament IDs for leaderboard lookup
      const tournamentIds = tournaments.map(t => t.id);

      // Collect winner IDs (these are sr_ids, not internal UUIDs)
      const winnerSrIds = tournaments
        .map(t => t.winner_id)
        .filter((id): id is string => !!id);

      // Fetch winner details by sr_id and leaderboard scores in parallel
      const [winnersResult, leaderboardResult] = await Promise.all([
        // Fetch winner details by sr_id (winner_id stores sr_id, not internal id)
        winnerSrIds.length > 0 
          ? supabase
              .from('sr_players')
              .select('sr_id, first_name, last_name, photo_url')
              .in('sr_id', winnerSrIds)
          : Promise.resolve({ data: [] }),
        // Fetch full boards for these tournaments. Team champion prose depends on
        // event-wide surname-collision detection, so position-1-only data is not
        // enough even though the winner row itself is still resolved from P1.
        supabase
          .from('sr_leaderboards')
          .select(`
            id,
            tournament_id,
            position,
            position_tied,
            score,
            player:sr_players!sr_leaderboards_player_id_fkey(
              id, sr_id, first_name, last_name, full_name, photo_url
            ),
            team:sr_teams!sr_leaderboards_team_id_fkey(
              id, sr_id, display_name, abbr_name,
              members:sr_team_players(
                position_in_team,
                player:sr_players!sr_team_players_player_id_fkey(id, full_name, photo_url)
              )
            )
          `)
          .in('tournament_id', tournamentIds)
          .not('position', 'is', null)
          .order('position', { ascending: true }),
      ]);

      // Build winner map from sr_players query
      const winnerMap: Record<string, { first_name: string; last_name: string; photo_url: string | null }> = {};
      if (winnersResult.data) {
        winnersResult.data.forEach((w: any) => {
          if (w.sr_id) {
            winnerMap[w.sr_id] = {
              first_name: w.first_name || '',
              last_name: w.last_name || '',
              photo_url: w.photo_url,
            };
          }
        });
      }

      // Build leaderboard groups for winner scores (and as fallback for winner info).
      // Team names are resolved after the full event board is known so surname
      // collisions apply uniformly across the event.
      const leaderboardByTournament: Record<string, BoardEntry[]> = {};
      if (leaderboardResult.data) {
        leaderboardResult.data.forEach((entry: any) => {
          const boardEntry: BoardEntry = {
            id: entry.id ?? `${entry.tournament_id}:${entry.player?.id ?? entry.team?.id ?? entry.position}`,
            position: entry.position ?? null,
            position_tied: entry.position_tied ?? null,
            score: entry.score ?? null,
            player: entry.player
              ? {
                  id: entry.player.id,
                  sr_id: entry.player.sr_id ?? null,
                  full_name: entry.player.full_name || [entry.player.first_name, entry.player.last_name].filter(Boolean).join(' '),
                  photo_url: entry.player.photo_url ?? null,
                }
              : null,
            team: entry.team
              ? {
                  id: entry.team.id,
                  sr_id: entry.team.sr_id ?? null,
                  display_name: entry.team.display_name ?? null,
                  abbr_name: entry.team.abbr_name ?? null,
                  members: entry.team.members ?? [],
                }
              : null,
          };
          const list = leaderboardByTournament[entry.tournament_id] ?? [];
          list.push(boardEntry);
          leaderboardByTournament[entry.tournament_id] = list;
        });
      }

      const leaderboardMap: Record<string, {
        score: number | null;
        name: string | null;
        photo_url: string | null;
        sr_id: string | null;
      }> = {};
      Object.entries(leaderboardByTournament).forEach(([tournamentId, board]) => {
        const top = board[0];
        if (!top) return;
        const entity = resolveBoardEntity(top, teamNamesNeedInitials(board));
        const firstMemberPhoto = top.team?.members
          ?.slice()
          .sort((a, b) => (a.position_in_team ?? 0) - (b.position_in_team ?? 0))[0]?.player?.photo_url ?? null;
        leaderboardMap[tournamentId] = {
          score: top.score,
          name: entity.prose || null,
          photo_url: top.player?.photo_url ?? firstMemberPhoto,
          sr_id: top.player?.sr_id ?? top.team?.sr_id ?? null,
        };
      });

      return tournaments.map((row: any): TourTournamentWithWinner => {
        // Try to get winner from winner_id first, then fall back to leaderboard position 1
        const winnerFromId = row.winner_id ? winnerMap[row.winner_id] : null;
        const board = leaderboardByTournament[row.id] ?? [];
        const championEntry = resolveChampionEntry(board, { winner_id: row.winner_id ?? null, event_type: row.event_type ?? null });
        const championEntity = championEntry ? resolveBoardEntity(championEntry, teamNamesNeedInitials(board)) : null;
        const leaderboardEntry = championEntry
          ? {
              score: championEntry.score,
              name: championEntity?.prose || null,
              photo_url: championEntry.player?.photo_url ?? championEntry.team?.members
                ?.slice()
                .sort((a: any, b: any) => (a.position_in_team ?? 0) - (b.position_in_team ?? 0))[0]?.player?.photo_url ?? null,
              sr_id: championEntry.player?.sr_id ?? championEntry.team?.sr_id ?? null,
            }
          : null;
        
        // Use winner_id data if available, otherwise use leaderboard position 1
        const winnerName = winnerFromId 
          ? `${winnerFromId.first_name} ${winnerFromId.last_name}`.trim()
          : leaderboardEntry?.name
            ? leaderboardEntry.name
            : null;
        
        const winnerPhotoUrl = winnerFromId?.photo_url 
          || leaderboardEntry?.photo_url 
          || null;

        // Format score as string (e.g., "-23" or "+5")
        const winnerScore = leaderboardEntry?.score != null
          ? (leaderboardEntry.score <= 0 ? String(leaderboardEntry.score) : `+${leaderboardEntry.score}`)
          : null;

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
          winningShare: row.winning_share,
          purse: row.purse,
          currency: row.currency,
          defendingChampion: row.defending_champion,
          tourId: row.season.tour_id,
          tourName: row.season.tour_name,
          tourSlug: mapTourSlug(row.season.tour_name),
          winnerId: row.winner_id,
          winnerName,
          winnerPhotoUrl,
          winnerScore,
        };
      });
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch tournaments grouped by tour with stats - CURRENT SEASON ONLY
 */
export function useTournamentsByTour() {
  return useQuery({
    queryKey: ['overview-tournaments-by-tour', 'current-season'],
    queryFn: async () => {
      // Get current year - most tours use calendar year
      // PGA Tour 2025-2026 season tournaments are stored as year=2026
      const currentYear = new Date().getFullYear();

      // Get tournament counts by tour for CURRENT YEAR ONLY
      const { data: countData, error: countError } = await supabase
        .from('sr_tournaments')
        .select(`
          status,
          season:sr_seasons!inner(
            tour_id,
            tour_name,
            year
          )
        `)
        // Tour overview stats sit beside leader/champion surfaces; count only
        // formats whose boards support to-par standings.
        .in('event_type', ['stroke', 'team'])
        .eq('sr_seasons.year', currentYear);

      if (countError) throw countError;

      // Get next upcoming tournament per tour
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          venue_name,
          venue_city,
          venue_country,
          venue_par,
          venue_yardage,
          winning_share,
          purse,
          currency,
          defending_champion,
          season:sr_seasons!inner(
            tour_id,
            tour_name,
            year
          )
        `)
        .in('event_type', ['stroke', 'team'])
        .in('status', ['scheduled', 'created'])
        .gte('start_date', new Date().toISOString().split('T')[0])
        .eq('sr_seasons.year', currentYear)
        .order('start_date', { ascending: true });

      if (upcomingError) throw upcomingError;

      // Group counts by tour
      const tourMap = new Map<string, TourStats>();

      (countData || []).forEach((row: any) => {
        const tourId = row.season.tour_id;
        const tourSlug = mapTourSlug(row.season.tour_name);
        
        if (!tourMap.has(tourId)) {
          tourMap.set(tourId, {
            tourId,
            tourName: row.season.tour_name,
            tourSlug,
            tournamentCount: 0,
            liveCount: 0,
            upcomingCount: 0,
            completedCount: 0,
            nextTournament: null,
          });
        }

        const stats = tourMap.get(tourId)!;
        stats.tournamentCount++;
        const _st = (row.status || '').toLowerCase();
        if (_st === 'inprogress' || _st === 'in_progress' ||
            _st === 'playoff' || _st === 'inplayoff' || _st === 'in_playoff' ||
            _st === 'suspended' || _st === 'delayed' || _st === 'weather' || _st === 'holdup') {
          stats.liveCount++;
        }
        if (_st === 'scheduled' || _st === 'created') stats.upcomingCount++;
        if (_st === 'closed' || _st === 'complete') stats.completedCount++;
      });

      // Assign next tournament to each tour
      (upcomingData || []).forEach((row: any) => {
        const tourId = row.season.tour_id;
        const stats = tourMap.get(tourId);
        if (stats && !stats.nextTournament) {
          stats.nextTournament = {
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
            winningShare: row.winning_share,
            purse: row.purse,
            currency: row.currency,
            defendingChampion: row.defending_champion,
            tourId: row.season.tour_id,
            tourName: row.season.tour_name,
            tourSlug: mapTourSlug(row.season.tour_name),
          };
        }
      });

      return Array.from(tourMap.values()).sort((a, b) => b.tournamentCount - a.tournamentCount);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch overview stats (ranked players, tournaments, courses)
 */
export function useOverviewStats() {
  return useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      // Parallel queries
      const [rankingsRes, playersRes, tournamentsRes, coursesRes, worldNo1Res] = await Promise.all([
        supabase.from('sr_world_rankings').select('id', { count: 'exact', head: true }),
        supabase.from('sr_players').select('id', { count: 'exact', head: true }),
        supabase.from('sr_tournaments').select('id', { count: 'exact', head: true }),
        supabase.from('sr_courses').select('id', { count: 'exact', head: true }),
        supabase
          .from('sr_world_rankings')
          .select(`
            rank,
            avg_points,
            player:sr_players!inner(
              id,
              first_name,
              last_name,
              country,
              country_code,
              photo_url
            )
          `)
          .eq('rank', 1)
          .limit(1)
          .single(),
      ]);

      // Count live tournaments
      const liveRes = await supabase
        .from('sr_tournaments')
        .select('id', { count: 'exact', head: true })
        .in('status', [
          'inprogress', 'in_progress',
          'playoff', 'inplayoff', 'in_playoff',
          'suspended', 'delayed', 'weather', 'holdup',
        ]);

      const worldNo1Data = worldNo1Res.data as any;

      return {
        rankedPlayers: rankingsRes.count || 0,
        totalPlayers: playersRes.count || 0,
        totalTournaments: tournamentsRes.count || 0,
        uniqueCourses: coursesRes.count || 0,
        liveTournaments: liveRes.count || 0,
        worldNo1: worldNo1Data ? {
          playerId: worldNo1Data.player.id,
          rank: worldNo1Data.rank,
          avgPoints: worldNo1Data.avg_points,
          firstName: worldNo1Data.player.first_name,
          lastName: worldNo1Data.player.last_name,
          fullName: `${worldNo1Data.player.first_name} ${worldNo1Data.player.last_name}`,
          country: worldNo1Data.player.country,
          countryCode: worldNo1Data.player.country_code,
          photoUrl: worldNo1Data.player.photo_url,
        } : null,
      } as OverviewStats;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Get leaderboard leaders for a live tournament
 */
export function useTournamentLeader(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tournament-leader', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          position,
          score,
          strokes,
          thru,
          player:sr_players!sr_leaderboards_player_id_fkey(
            id, first_name, last_name, country, photo_url
          ),
          team:sr_teams!sr_leaderboards_team_id_fkey(
            id, display_name, abbr_name, country,
            members:sr_team_players(
              position_in_team,
              player:sr_players!sr_team_players_player_id_fkey(id, full_name, photo_url, country)
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .gt('strokes', 0)
        .not('position', 'is', null)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      let player: any = (data as any).player;
      const team = (data as any).team;
      if (!player && team) {
        const members = (team.members || [])
          .filter((m: any) => m.player)
          .sort((a: any, b: any) => a.position_in_team - b.position_in_team);
        const teamName = team.abbr_name || team.display_name || 'Team';
        player = {
          id: team.id,
          first_name: '',
          last_name: '',
          country: team.country,
          photo_url: members[0]?.player?.photo_url ?? null,
          _teamName: teamName,
        };
      }
      if (!player) return null;

      // Score is relative to par (negative = under par)
      const scoreToPar = data.score;
      const scoreDisplay = scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

      return {
        position: data.position,
        score: data.score,
        scoreToPar,
        scoreDisplay,
        thru: data.thru,
        player: {
          id: player.id,
          firstName: player.first_name ?? '',
          lastName: player.last_name ?? '',
          fullName: player._teamName ?? player.full_name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim(),
          country: player.country,
          photoUrl: player.photo_url,
        },
      };
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
  });
}

/**
 * Leader entry for top 5 mini leaderboard
 */
export interface LeaderEntry {
  position: number;
  score: number;
  scoreToPar: number;
  scoreDisplay: string;
  thru: number | null;
  status: string | null;
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  round_4: number | null;
  updatedAt: string | null;
  thruUpdatedAt: string | null;
  tournamentTimezone: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    headshotOverride?: string | null;
    country: string | null;
    photoUrl: string | null;
    pgaTourId: string | null;
    tourCode?: string | null;
  };
}

/**
 * Get top 5 leaderboard entries for a live tournament
 * Only runs when tournamentId is not null
 */
export function useTournamentTopLeaders(tournamentId: string | null) {
  return useQuery({
    queryKey: ['tournament-top-leaders', tournamentId],
    queryFn: async (): Promise<LeaderEntry[]> => {
      if (!tournamentId) return [];

      // First fetch tournament timezone
      const { data: tournamentData } = await supabase
        .from('sr_tournaments')
        .select('timezone')
        .eq('id', tournamentId!)
        .maybeSingle();

      const tournamentTimezone = tournamentData?.timezone ?? null;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          position,
          score,
          strokes,
          thru,
          status,
          updated_at,
          thru_updated_at,
          round_1,
          round_2,
          round_3,
          round_4,
          player:sr_players!inner(
            id,
            first_name,
            last_name,
            full_name,
            headshot_override,
            country,
            photo_url,
            pga_tour_id,
            tour_codes
          )
        `)
        .eq('tournament_id', tournamentId!)
        .gt('strokes', 0)
        .not('position', 'is', null)
        .order('position', { ascending: true })
        .limit(10);

      // Deliberate swallow: these rows decorate hero bands - quiet emptiness beats an error card inside a cinematic frame.
      if (error || !data) return [];

      return data.map((row: any): LeaderEntry => {
        const scoreToPar = row.score;
        const scoreDisplay = scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

        return {
          position: row.position,
          score: row.score,
          scoreToPar,
          scoreDisplay,
          thru: row.thru,
          status: row.status ?? null,
          updatedAt: row.updated_at ?? null,
          thruUpdatedAt: row.thru_updated_at ?? null,
          tournamentTimezone,
          round_1: row.round_1 ?? null,
          round_2: row.round_2 ?? null,
          round_3: row.round_3 ?? null,
          round_4: row.round_4 ?? null,
          player: {
            id: row.player.id,
            firstName: row.player.first_name,
            lastName: row.player.last_name,
            fullName: row.player.full_name || `${row.player.first_name} ${row.player.last_name}`,
            headshotOverride: row.player.headshot_override ?? null,
            country: row.player.country,
            photoUrl: row.player.photo_url,
            pgaTourId: row.player.pga_tour_id ?? null,
            tourCode: row.player.tour_codes?.[0] ?? null,
          },
        };
      });
    },
    enabled: !!tournamentId,
    staleTime: 30_000,             // 30s — matches sync interval
    refetchInterval: false,        // No polling — Realtime pushes updates
    refetchOnWindowFocus: true,
  });
}
