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
import { isAnyMajor, getMajorType } from '../utils/majorScope';
import { isTournamentDecided } from '@/utils/tournamentDecided';

// Tour priority order for sorting live tournaments
const TOUR_PRIORITY: TourId[] = ['pga', 'liv', 'euro', 'lpga', 'pgad', 'champ'];

export interface HeroTournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venueName: string | null;
  venueCourseName: string | null;
  venueCity: string | null;
  venueState: string | null;
  venueCountry: string | null;
  venuePar: number | null;
  venueYardage: number | null;
  purse: number | null;
  winningShare: number | null;
  currency: string | null;
  /** 'major' is a synthetic pseudo-tour used for pinned major slides (mens or womens). */
  tourSlug: TourId | 'major';
  tourName: string;
  defendingChampion: string | null;
  defendingChampionPhotoUrl: string | null;
  defendingChampionPgaTourId: string | null;
  championNarrative: string | null;
  isMajor: boolean;
  isSignature: boolean;
  /** True when this slide is the pseudo-tour major entry (mens or womens). */
  isPseudoMajorTour?: boolean;
  /** For pseudo-major slides only: which major type this slide represents. */
  majorGender?: 'mens' | 'womens';
  // Winner info (for completed)
  winnerId: string | null;
  winnerName: string | null;
  winnerPhotoUrl: string | null;
  winnerPgaTourId: string | null;
  winnerScore: string | null;
  currentRound: number | null;
  currentRoundStatus: string | null;
  
}

export interface HeroSlide {
  tournament: HeroTournament;
  type: 'live' | 'completed' | 'upcoming';
}

function mapTourSlug(tourName: string): TourId {
  const normalized = tourName?.toLowerCase().trim();
  if (normalized === 'pga' || normalized === 'pga tour') return 'pga';
  if (normalized === 'euro' || normalized === 'eur' || normalized === 'dp world' || normalized === 'dp world tour' || normalized === 'european tour') return 'euro';
  if (normalized === 'lpga' || normalized === 'lpga tour') return 'lpga';
  if (normalized === 'liv' || normalized === 'liv golf') return 'liv';
  if (normalized === 'pgad' || normalized === 'korn ferry') return 'pgad';
  if (normalized === 'champ' || normalized === 'champions' || normalized === 'champions-tour' || normalized === 'champions tour') return 'champ';
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

      // Fetch winner details, leaderboard data, defending champion photos,
      // AND confirmed event_winners rows in parallel.
      const [winnersResult, leaderboardResult, defendingChampionResult, eventWinnersResult] = await Promise.all([
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
                tournament_id, position, position_tied, score,
                player:sr_players!sr_leaderboards_player_id_fkey(sr_id, first_name, last_name, photo_url, pga_tour_id),
                team:sr_teams!sr_leaderboards_team_id_fkey(
                  sr_id, display_name, abbr_name,
                  members:sr_team_players(position_in_team, player:sr_players!sr_team_players_player_id_fkey(sr_id, first_name, last_name, photo_url))
                )
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
        allTournamentIds.length > 0
          ? supabase
              .from('event_winners')
              .select('tournament_id, player_id')
              .in('tournament_id', allTournamentIds)
              .not('player_id', 'is', null)
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

      // Build leaderboard map — synthesize a player-shaped object from team data when needed.
      // Also track per-tournament tie state: count of pos=1 rows + position_tied flag +
      // whether the leader is a team entry.
      const leaderboardMap: Record<string, { score: number | null; player: any }> = {};
      const tieMap: Record<string, { topRowCount: number; topTie: boolean; isTeamEvent: boolean }> = {};
      (leaderboardResult.data || []).forEach((entry: any) => {
        // Accumulate tie metadata first (every pos=1 row counts).
        const prev = tieMap[entry.tournament_id] || { topRowCount: 0, topTie: false, isTeamEvent: false };
        tieMap[entry.tournament_id] = {
          topRowCount: prev.topRowCount + 1,
          topTie: prev.topTie || Boolean(entry.position_tied),
          isTeamEvent: prev.isTeamEvent || Boolean(entry.team && !entry.player),
        };

        let player = entry.player;
        if (!player && entry.team) {
          // Team event: synthesize a "player" object so downstream renders show the team name
          const members = (entry.team.members || [])
            .filter((m: any) => m.player)
            .sort((a: any, b: any) => a.position_in_team - b.position_in_team);
          const primary = members[0]?.player;
          const teamName = entry.team.abbr_name || entry.team.display_name || '';
          player = {
            sr_id: entry.team.sr_id,
            first_name: '',
            last_name: teamName,
            full_name: teamName,
            photo_url: primary?.photo_url ?? null,
            pga_tour_id: null,
            _isTeam: true,
            _teamName: teamName,
            _teamMembers: members.map((m: any) => ({
              fullName: m.player.full_name || `${m.player.first_name || ''} ${m.player.last_name || ''}`.trim(),
              photoUrl: m.player.photo_url,
            })),
          };
        }
        if (player && !leaderboardMap[entry.tournament_id]) {
          // First pos=1 row only — leaderboardMap holds the "regulation leader".
          leaderboardMap[entry.tournament_id] = { score: entry.score, player };
        }
      });

      // Build confirmed-winner map from event_winners (authoritative).
      const confirmedWinnerSet = new Set<string>();
      ((eventWinnersResult as any).data || []).forEach((w: any) => {
        if (w.tournament_id) confirmedWinnerSet.add(w.tournament_id);
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
          const tie = tieMap[row.id];

          // Format-aware "decided" gate — never crown a tied top.
          const winnerConfirmed = confirmedWinnerSet.has(row.id) || Boolean(winnerFromId);
          const { decided } = isTournamentDecided({
            status: row.status,
            winnerConfirmed,
            topRowCount: tie?.topRowCount ?? 1,
            topTie: tie?.topTie ?? false,
            isTeamEvent: tie?.isTeamEvent ?? false,
            // Team event "decided" only when an authoritative winner row exists.
            teamWinnerConfirmed: winnerConfirmed,
          });

          if (decided) {
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
          // Undecided → leave winnerName null; the hero's winner-gate renders
          // the awaiting-playoff / tie summary instead of crowning regulation leader.
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
          venueCourseName: row.venue_course_name,
          venueCity: row.venue_city,
          venueState: row.venue_state,
          venueCountry: row.venue_country,
          venuePar: row.venue_par,
          venueYardage: row.venue_yardage,
          purse: row.purse,
          winningShare: row.winning_share,
          currency: row.currency,
          tourSlug,
          tourName: tourConfig?.name || 'PGA Tour',
          defendingChampion: row.defending_champion || null,
          defendingChampionPhotoUrl: champData?.photo_url ?? null,
          defendingChampionPgaTourId: champData?.pga_tour_id ?? null,
          championNarrative: row.champion_narrative || null,
          isMajor: contextLabel === 'MAJOR CHAMPIONSHIP' || isAnyMajor(row.name || ''),
          isSignature: contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES',
          winnerId: row.winner_id,
          winnerName,
          winnerPhotoUrl,
          winnerPgaTourId,
          winnerScore,
          currentRound: (row as any).current_round ?? null,
          currentRoundStatus: (row as any).current_round_status ?? null,
          
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
        // Defensive re-bucket: a closed event whose top is tied + no confirmed winner
        // is "unresolved" (playoff pending) — route to the LIVE bucket so it stays
        // featured and never gets crowned.
        const tie = tieMap[t.id];
        const winnerConfirmed = confirmedWinnerSet.has(t.id) || Boolean(t.winner_id);
        const isUnresolved = !winnerConfirmed && (tie?.topTie || (tie?.topRowCount ?? 1) > 1);
        if (isUnresolved && liveByTour[tournament.tourSlug]) {
          liveByTour[tournament.tourSlug].push(tournament);
        } else if (completedByTour[tournament.tourSlug]) {
          completedByTour[tournament.tourSlug].push(tournament);
        }
      });

      upcomingTournaments.forEach(t => {
        const tournament = transformTournament(t, false);
        if (upcomingByTour[tournament.tourSlug]) upcomingByTour[tournament.tourSlug].push(tournament);
      });

      // ---- Active major routing (MAJ-1, generalised) ----
      // A major is "active" when it is live OR starts within 10 days. While
      // active it OWNS a synthetic 'major' pseudo-tour slide and is evicted
      // from its native tour bucket. This applies to BOTH mens majors (evicted
      // from PGA/EURO/etc.) and womens majors (evicted from LPGA). The
      // cross-tour PGA injection block below still filters on 'mens' only -
      // womens majors are never promoted onto the PGA tab.
      //
      // Either, both, or neither major can be active at once. When both are
      // active, ordering rule: mens-live > womens-live > by start_date asc.
      // A live major always beats an upcoming one regardless of type; that
      // falls out naturally because live slides render before upcoming slides.
      const nowMs = Date.now();
      const MAJOR_WINDOW_MS = 10 * 86_400_000;
      const findActiveMajor = (
        rows: CachedTournament[],
        type: 'mens' | 'womens',
      ): CachedTournament | null => {
        const live = rows.find(
          t => t.status === 'inprogress' && getMajorType(t.name || '') === type,
        );
        if (live) return live;
        const soon = [...rows]
          .filter(t => t.status !== 'inprogress' && getMajorType(t.name || '') === type)
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
          .find(t => {
            const s = new Date(t.start_date + 'T12:00:00Z').getTime();
            return (s - nowMs) <= MAJOR_WINDOW_MS && (s - nowMs) >= -MAJOR_WINDOW_MS;
          });
        return soon ?? null;
      };
      const allRows = [...liveTournaments, ...upcomingTournaments];
      const activeMajorRow = findActiveMajor(allRows, 'mens');
      const activeWomensMajorRow = findActiveMajor(allRows, 'womens');
      const activeMajorId = activeMajorRow?.id ?? null;
      const activeWomensMajorId = activeWomensMajorRow?.id ?? null;

      // Cross-tour major promotion (existing behaviour) - mens only. SKIP the
      // active mens major so it doesn't evict the true PGA next event. Womens
      // majors are never promoted onto PGA.
      const crossTourMajors = upcomingTournaments
        .map(t => transformTournament(t, false))
        .filter(t => getMajorType(t.name || '') === 'mens' && t.tourSlug !== 'pga' && t.id !== activeMajorId);

      crossTourMajors.forEach(major => {
        const alreadyInPga = upcomingByTour['pga'].some(t => t.id === major.id);
        if (!alreadyInPga) {
          upcomingByTour['pga'].push({ ...major, tourSlug: 'pga' });
        }
      });

      // Re-sort PGA upcoming by start date so promoted majors appear in correct position
      upcomingByTour['pga'].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      // Evict every active major from every native tour bucket - each lives
      // only in its synthetic 'major' slide below. Symmetric for mens/womens.
      const evictIds = new Set<string>();
      if (activeMajorId) evictIds.add(activeMajorId);
      if (activeWomensMajorId) evictIds.add(activeWomensMajorId);
      if (evictIds.size > 0) {
        TOUR_PRIORITY.forEach(tour => {
          liveByTour[tour] = liveByTour[tour].filter(t => !evictIds.has(t.id));
          upcomingByTour[tour] = upcomingByTour[tour].filter(t => !evictIds.has(t.id));
        });
      }

      // Build slides per tour based on priority logic
      const liveSlides: HeroSlide[] = [];
      const completedSlides: HeroSlide[] = [];
      const upcomingSlides: HeroSlide[] = [];

      TOUR_PRIORITY.forEach(tour => {
        const live = liveByTour[tour];
        const completed = completedByTour[tour];
        const upcoming = upcomingByTour[tour];

        if (live.length > 0) {
          // EURO can host multiple concurrent live events (Scottish + ISCO). Prefer
          // the larger field as the primary slot; leaderboard row count is a good
          // proxy since sr_leaderboards fans out per-player. Fall back to purse.
          const sizeFor = (t: HeroTournament) => tieMap[t.id]?.topRowCount ?? 0;
          const sorted = [...live].sort((a, b) => {
            // Field-size heuristic can't come from the pos=1-only leaderboard query,
            // so use purse (which correlates strongly with field size at the
            // primary tour level) as the primary key. This preserves existing
            // "biggest event leads" behaviour when field-size data is unavailable.
            const purseDiff = (b.purse || 0) - (a.purse || 0);
            if (purseDiff !== 0) return purseDiff;
            return sizeFor(b) - sizeFor(a);
          });
          for (const tournament of sorted) {
            liveSlides.push({ tournament, type: 'live' });
          }
        } else if (completed.length > 0) {
          // Age gate (MICRO_BRIEF_TOUR_SEASON_COMPLETE_WINDOW §2). The bucket is
          // fetched wide (COMPLETED_BUCKET_DAYS) so the cap lives HERE, in the
          // selection — never in deriveHeroState.
          //   tour HAS an upcoming event  -> result stands RESULTS_HANDOVER_DAYS,
          //                                  then the upcoming card takes the slot
          //   tour has NO upcoming event  -> result stands RESULTS_CAP_DAYS, then
          //                                  the TOUR is omitted from the carousel
          // Both measured in DAYS against end_date, same unit as the bucket.
          const hasUpcoming = upcoming.length > 0;
          const maxAge = hasUpcoming ? RESULTS_HANDOVER_DAYS : RESULTS_CAP_DAYS;
          const inWindow = completed.filter(t => {
            const age = daysSinceEndDate(t.endDate);
            return age == null || age <= maxAge;
          });

          if (inWindow.length > 0) {
            // Concurrent completed events (e.g. two DPWT events the same week)
            // each get a slide - mirrors the live branch. The bucket is bounded,
            // so this cannot flood.
            for (const tournament of inWindow) {
              completedSlides.push({ tournament, type: 'completed' });
            }
          } else if (hasUpcoming) {
            // Handover: the stale result steps aside for the next event.
            pushUpcomingForTour(tour, upcoming);
          }
          // else: season complete past the cap — the TOUR is omitted entirely.
          // No slide, no empty slot, no placeholder.
        } else if (upcoming.length > 0) {
          pushUpcomingForTour(tour, upcoming);
        }

      });

      // Inject synthetic MAJOR slide(s) — one per active major (mens/womens).
      const injectMajorSlide = (row: CachedTournament, gender: 'mens' | 'womens') => {
        const majorTournament: HeroTournament = {
          ...transformTournament(row, false),
          tourSlug: 'major',
          tourName: 'The Majors',
          isPseudoMajorTour: true,
          majorGender: gender,
        };
        if (row.status === 'inprogress') {
          liveSlides.unshift({ tournament: majorTournament, type: 'live' });
        } else {
          upcomingSlides.unshift({ tournament: majorTournament, type: 'upcoming' });
        }
      };
      if (activeMajorRow) injectMajorSlide(activeMajorRow, 'mens');
      if (activeWomensMajorRow) injectMajorSlide(activeWomensMajorRow, 'womens');

      // Sort within categories. When two pseudo-'major' slides coexist (both
      // majors active), order them: mens > womens; otherwise by start_date asc.
      // A live major always beats an upcoming one because live slides render
      // before upcoming slides in the return concat below.
      const majorSlideRank = (t: HeroTournament): number => {
        if (t.tourSlug !== 'major') return 2;
        return t.majorGender === 'mens' ? 0 : 1;
      };
      liveSlides.sort((a, b) => {
        const aMajor = a.tournament.tourSlug === 'major';
        const bMajor = b.tournament.tourSlug === 'major';
        if (aMajor && bMajor) {
          const rankDiff = majorSlideRank(a.tournament) - majorSlideRank(b.tournament);
          if (rankDiff !== 0) return rankDiff;
          return new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime();
        }
        if (aMajor) return -1;
        if (bMajor) return 1;
        if (a.tournament.isMajor !== b.tournament.isMajor) return a.tournament.isMajor ? -1 : 1;
        const ai = TOUR_PRIORITY.indexOf(a.tournament.tourSlug as TourId);
        const bi = TOUR_PRIORITY.indexOf(b.tournament.tourSlug as TourId);
        return ai - bi;
      });
      completedSlides.sort((a, b) => {
        const dateDiff = new Date(b.tournament.endDate).getTime() - new Date(a.tournament.endDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.tournament.purse || 0) - (a.tournament.purse || 0);
      });
      upcomingSlides.sort((a, b) => {
        const aMajor = a.tournament.tourSlug === 'major';
        const bMajor = b.tournament.tourSlug === 'major';
        if (aMajor && bMajor) {
          const rankDiff = majorSlideRank(a.tournament) - majorSlideRank(b.tournament);
          if (rankDiff !== 0) return rankDiff;
          return new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime();
        }
        if (aMajor) return -1;
        if (bMajor) return 1;
        return new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime();
      });

      // Per-category caps to prevent any one category from crowding out others
      const cappedLive = liveSlides.slice(0, 6);
      const cappedCompleted = completedSlides.slice(0, 6);
      const cappedUpcoming = upcomingSlides.slice(0, 6);

      return [...cappedLive, ...cappedCompleted, ...cappedUpcoming];
    },
    enabled: !!cache,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
