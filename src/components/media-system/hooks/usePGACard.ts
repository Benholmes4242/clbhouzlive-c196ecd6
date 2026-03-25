import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { useSingleCourseImage } from '@/features/tourhub/hooks/useCourseImageResolver';
import type { VenueInput } from '@/features/tourhub/hooks/useCourseImageResolver';
import type { PGACardFeedPost, PGACardData, PGACardLeader, PGACardChaser, PGACardStats } from '../types/media';
import { getTournamentDisplayState } from '@/utils/tournamentState';

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';
const PGA_TOUR_ID = 'b52068af-28e4-4e91-bdbb-037591b0ff84';
const PGA_TOUR_SLUG = 'pga';

// ── Insight helper ──
function getInsight(idx: number, leaderName: string | null, isTied: boolean, tiedCount: number): string {
  const last = leaderName?.split(' ').pop() ?? 'The leader';
  if (isTied && tiedCount >= 3) return `${tiedCount}-way tie at the top.`;
  if (isTied) return 'All square at the top.';
  if (idx >= 80) return 'Tight race — anyone can make a move.';
  if (idx >= 60) return 'The field is closing in. Expect drama.';
  if (idx <= 25) return `${last} is in full control.`;
  return `${last} leads. The chasers need to move soon.`;
}

// ── Round label helper ──
function getRoundLabel(round: number, total: number): string {
  if (round === total) return 'Final Round';
  if (round === 3) return 'Moving Day';
  if (round === 2) return 'Cut Day';
  return `Round ${round}`;
}

// ── Post ID helper ──
async function getOrCreatePost(tournamentId: string, tournamentName: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('upsert-live-tournament-post', {
      body: { tournamentId, tournamentName },
    });
    if (error || !data?.postId) return crypto.randomUUID();
    return data.postId;
  } catch {
    return crypto.randomUUID();
  }
}

// ── Scoring stats aggregator ──
function aggregateScoringStats(scorecards: any[], playerId: string) {
  const rows = scorecards.filter(s => s.player_id === playerId);
  if (!rows.length) return null;
  return {
    eagles:       rows.reduce((sum: number, r: any) => sum + (r.eagles ?? 0), 0),
    birdies:      rows.reduce((sum: number, r: any) => sum + (r.birdies ?? 0), 0),
    pars:         rows.reduce((sum: number, r: any) => sum + (r.pars ?? 0), 0),
    bogeys:       rows.reduce((sum: number, r: any) => sum + (r.bogeys ?? 0), 0),
    doubleBogeys: rows.reduce((sum: number, r: any) => sum + (r.double_bogeys ?? 0), 0),
  };
}

export function usePGACard(userId?: string): {
  pgaCard: PGACardFeedPost | null;
  isLoading: boolean;
} {
  // ── Live tournaments from useLiveArena ──
  const { data: arenaData, isLoading: arenaLoading } = useLiveArena();
  const pgaLive = useMemo(
    () => (arenaData ?? []).filter(t => t.tourSlug === PGA_TOUR_SLUG).sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0)),
    [arenaData]
  );
  const topLive = pgaLive[0] ?? null;

  // ── Most recent completed PGA event (within 3 days) ──
  const { data: recentResult, isLoading: resultLoading } = useQuery({
    queryKey: ['pga-card-result'],
    queryFn: async () => {
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .eq('tour_id', PGA_TOUR_ID);
      const seasonIds = (seasons ?? []).map(s => s.id);
      if (!seasonIds.length) return null;

      const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, purse, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage, venue_course_name, defending_champion, status, season_id')
        .in('status', ['closed', 'complete'])
        .in('season_id', seasonIds)
        .gte('end_date', cutoff)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      const state = getTournamentDisplayState(data.status, data.end_date);
      return state === 'result' ? data : null;
    },
    staleTime: 5 * 60_000,
    enabled: !topLive,
  });

  // ── Next upcoming PGA event ──
  const { data: nextUpcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['pga-card-upcoming'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .eq('tour_id', PGA_TOUR_ID);
      const seasonIds = (seasons ?? []).map(s => s.id);
      if (!seasonIds.length) return null;
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, purse, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage, venue_course_name, defending_champion, status, season_id')
        .in('status', ['scheduled', 'created'])
        .in('season_id', seasonIds)
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    staleTime: 30 * 60_000,
    enabled: !topLive && !recentResult,
  });

  // ── Course image resolver ──
  const activeVenue = useMemo((): VenueInput | null => {
    const t = topLive ?? (recentResult as any) ?? (nextUpcoming as any);
    if (!t?.venue_name && !t?.venueName) return null;
    return {
      venueName: t.venue_name ?? t.venueName,
      venueCourseName: t.venue_course_name ?? t.venueCourseName ?? null,
      city: t.venue_city ?? t.venueCity ?? null,
    };
  }, [topLive, recentResult, nextUpcoming]);

  const { courseImage } = useSingleCourseImage(activeVenue);
  const courseImageUrl = courseImage?.imageUrl ?? null;

  // ── Past winners at this venue (upcoming state only) ──
  const { data: pastWinnersRaw = [] } = useQuery({
    queryKey: ['pga-card-past-winners', (nextUpcoming as any)?.venue_name],
    queryFn: async () => {
      const venueName = (nextUpcoming as any)?.venue_name;
      if (!venueName) return [];

      // Extract first 2 distinctive words for a loose match
      // e.g. "Memorial Park Golf Course" → "Memorial Park"
      const keyword = venueName
        .split(' ')
        .filter((w: string) => w.length > 3)
        .slice(0, 2)
        .join(' ');
      if (!keyword) return [];

      // No season filter — past winners can be from any year
      const { data: tournaments } = await supabase
        .from('sr_tournaments')
        .select('id, end_date')
        .in('status', ['closed', 'complete'])
        .ilike('venue_name', `%${keyword}%`)
        .order('end_date', { ascending: false })
        .limit(3);

      if (!tournaments?.length) return [];

      const results = await Promise.all(
        tournaments.map(async (t) => {
          const { data: lb } = await (supabase
            .from('sr_leaderboards') as any)
            .select(`
              score,
              player:sr_players!sr_leaderboards_player_id_fkey (
                full_name, photo_url, headshot_override
              )
            `)
            .eq('tournament_id', t.id)
            .eq('position', 1)
            .limit(1)
            .maybeSingle();

          if (!lb?.player) return null;
          const year = new Date(t.end_date + 'T12:00:00').getFullYear();
          return {
            year,
            playerName: lb.player.full_name as string,
            photoUrl: (lb.player.headshot_override
              ?? getPlayerHeadshotUrl(lb.player.full_name, PGA_TOUR_SLUG)
              ?? lb.player.photo_url
              ?? null) as string | null,
            scoreDisplay: lb.score != null
              ? lb.score === 0 ? 'E' : lb.score > 0 ? `+${lb.score}` : `${lb.score}`
              : null,
          };
        })
      );

      return results.filter(Boolean) as Array<{
        year: number;
        playerName: string;
        photoUrl: string | null;
        scoreDisplay: string | null;
      }>;
    },
    enabled: !!nextUpcoming && !topLive && !recentResult,
    staleTime: 30 * 60_000,
  });

  // ── Result leaderboard (final standings) ──
  const { data: resultLeaderboard } = useQuery({
    queryKey: ['pga-card-result-lb', (recentResult as any)?.id],
    queryFn: async () => {
      if (!recentResult) return [];
      const { data } = await (supabase
        .from('sr_leaderboards') as any)
        .select(`
          position, score, money,
          player:sr_players!sr_leaderboards_player_id_fkey (
            id, full_name, photo_url, headshot_override
          )
        `)
        .eq('tournament_id', (recentResult as any).id)
        .order('position', { ascending: true })
        .limit(10);
      return data ?? [];
    },
    enabled: !!recentResult && !topLive,
    staleTime: 10 * 60_000,
  });

  // ── Scorecards for live tournament ──
  const livePlayerIds = useMemo(() => {
    if (!topLive) return [];
    return [topLive.leader, ...topLive.chasePack]
      .filter(Boolean)
      .map(p => p!.playerId)
      .slice(0, 10);
  }, [topLive]);

  const { data: liveScorecards = [] } = useQuery({
    queryKey: ['pga-card-scorecards-live', topLive?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sr_scorecards')
        .select('player_id, round_number, eagles, birdies, pars, bogeys, double_bogeys')
        .eq('tournament_id', topLive!.id)
        .in('player_id', livePlayerIds);
      return data ?? [];
    },
    enabled: !!topLive?.id && livePlayerIds.length > 0,
    staleTime: 60_000,
  });

  // ── Tournament result meta (authoritative stats from inject-tournament-post) ──
  const { data: resultMeta } = useQuery({
    queryKey: ['pga-card-result-meta', (recentResult as any)?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournament_result_meta')
        .select('stat_birdies, stat_eagles, stat_pars, stat_bogeys')
        .eq('tournament_id', (recentResult as any).id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!recentResult && !topLive,
    staleTime: 10 * 60_000,
  });

  // ── Scorecards for result tournament (fallback) ──
  const { data: resultScorecards = [] } = useQuery({
    queryKey: ['pga-card-scorecards-result', (recentResult as any)?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sr_scorecards')
        .select('player_id, round_number, eagles, birdies, pars, bogeys, double_bogeys')
        .eq('tournament_id', (recentResult as any).id);
      return data ?? [];
    },
    enabled: !!recentResult && !topLive && !resultMeta,
    staleTime: 10 * 60_000,
  });

  // ── Champion season stats (result only) ──
  const resultLeaderId = useMemo(() => {
    if (!resultLeaderboard || (resultLeaderboard as any[]).length === 0) return null;
    return (resultLeaderboard as any[])[0]?.player?.id ?? null;
  }, [resultLeaderboard]);

  const { data: championSeasonStats } = useQuery({
    queryKey: ['pga-card-champion-stats', resultLeaderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('sr_player_statistics')
        .select('driving_distance, driving_accuracy, greens_in_reg, putting_average')
        .eq('player_id', resultLeaderId!)
        .order('season_id', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!resultLeaderId && !topLive,
    staleTime: 10 * 60_000,
  });

  // ── Determine active tournament for post ID / counts ──
  const activeTournamentId = topLive?.id ?? recentResult?.id ?? nextUpcoming?.id ?? null;
  const activeTournamentName = topLive?.name ?? (recentResult as any)?.name ?? (nextUpcoming as any)?.name ?? '';

  const { data: postId = '' } = useQuery({
    queryKey: ['pga-card-post-id', activeTournamentId],
    queryFn: () => getOrCreatePost(activeTournamentId!, activeTournamentName),
    enabled: !!activeTournamentId,
    staleTime: 10 * 60_000,
    retry: false,
  });

  const { data: engagementData } = useQuery({
    queryKey: ['pga-card-counts', postId, userId],
    queryFn: async () => {
      if (!postId) return { likeCount: 0, commentCount: 0, isLikedByMe: false };
      const [lr, cr] = await Promise.all([
        supabase.from('post_likes').select('post_id,user_id').eq('post_id', postId),
        supabase.from('post_comments').select('post_id').eq('post_id', postId),
      ]);
      const likes = lr.data ?? [];
      return {
        likeCount: likes.length,
        commentCount: cr.data?.length ?? 0,
        isLikedByMe: userId ? likes.some(l => l.user_id === userId) : false,
      };
    },
    enabled: !!postId,
    staleTime: 30_000,
  });

  const eng = engagementData ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };

  // ── Build card data based on priority ──
  const cardData = useMemo((): PGACardData | null => {
    // LIVE state
    if (topLive) {
      const allPlayers = [topLive.leader, ...topLive.chasePack].filter(Boolean);
      const seen = new Set<string>();
      const lb = allPlayers
        .filter(p => { if (seen.has(p!.playerId)) return false; seen.add(p!.playerId); return true; })
        .sort((a, b) => a!.position - b!.position)
        .slice(0, 10);
      const lp = lb[0] ?? null;
      const coLeaders = lb.filter(p => p?.position === 1);
      const isTied = coLeaders.length > 1;

      const leader: PGACardLeader | null = lp ? {
        playerId: lp.playerId,
        playerName: lp.player.fullName,
        photoUrl: getPlayerHeadshotUrl(lp.player.fullName, PGA_TOUR_SLUG, lp.player.headshotOverride) ?? null,
        scoreDisplay: lp.scoreDisplay,
        score: lp.score,
        thru: lp.thru,
        today: null,
        scoringStats: liveScorecards.length ? aggregateScoringStats(liveScorecards, lp.playerId) : null,
      } : null;

      const chasers: PGACardChaser[] = lb
        .filter(p => p && p.position > 1)
        .slice(0, 4)
        .map(p => ({
          position: p!.position,
          playerName: p!.player.fullName,
          photoUrl: getPlayerHeadshotUrl(p!.player.fullName, PGA_TOUR_SLUG, p!.player.headshotOverride) ?? null,
          scoreDisplay: p!.scoreDisplay,
          isTied: lb.filter(x => x?.position === p?.position).length > 1,
          scoringStats: liveScorecards.length ? aggregateScoringStats(liveScorecards, p!.playerId) : null,
        }));

      const ls: PGACardStats | null = topLive.leaderStats ? {
        totalEagles: topLive.leaderStats.totalEagles,
        totalBirdies: topLive.leaderStats.totalBirdies,
        totalPars: topLive.leaderStats.totalPars,
        totalBogeys: topLive.leaderStats.totalBogeys,
        drivingDistance: topLive.leaderStats.drivingDistance ?? null,
        drivingAccuracy: topLive.leaderStats.drivingAccuracy ?? null,
        greensInReg: topLive.leaderStats.greensInReg ?? null,
        puttingAverage: topLive.leaderStats.puttingAverage ?? null,
      } : null;

      const round = topLive.currentRound ?? 1;
      return {
        tournamentId: topLive.id,
        tournamentName: topLive.name,
        purse: topLive.purse,
        state: 'live',
        venueName: topLive.venueName,
        venueCity: topLive.venueCity,
        venuePar: topLive.venuePar,
        venueYardage: topLive.venueYardage,
        courseImageUrl,
        currentRound: round,
        totalRounds: topLive.totalRounds,
        roundLabel: getRoundLabel(round, topLive.totalRounds),
        leader,
        chasers,
        leaderStats: ls,
        insight: getInsight(topLive.volatilityIndex, leader?.playerName ?? null, isTied, coLeaders.length),
        startDate: topLive.startDate,
        endDate: topLive.endDate,
        postId,
        ...eng,
        defendingChampion: null,
        defendingChampionPhotoUrl: null,
        pastWinners: null,
      };
    }

    // RESULT state
    if (recentResult) {
      const r = recentResult as any;
      const lb = (resultLeaderboard ?? []) as any[];
      const lp = lb[0] ?? null;

      const leader: PGACardLeader | null = lp ? {
        playerId: lp.player?.id ?? '',
        playerName: lp.player?.full_name ?? '',
        photoUrl: lp.player?.headshot_override
          ?? getPlayerHeadshotUrl(lp.player?.full_name ?? '', PGA_TOUR_SLUG)
          ?? lp.player?.photo_url
          ?? null,
        scoreDisplay: lp.score != null
          ? lp.score === 0 ? 'E' : lp.score > 0 ? `+${lp.score}` : `${lp.score}`
          : '—',
        score: lp.score ?? 0,
        thru: null,
        today: null,
        scoringStats: resultMeta?.stat_birdies != null
          ? { eagles: resultMeta.stat_eagles ?? 0, birdies: resultMeta.stat_birdies ?? 0, pars: resultMeta.stat_pars ?? 0, bogeys: resultMeta.stat_bogeys ?? 0, doubleBogeys: 0 }
          : resultScorecards.length ? aggregateScoringStats(resultScorecards, lp.player?.id ?? '') : null,
      } : null;

      const chasers: PGACardChaser[] = lb
        .filter((p: any) => p.position > 1)
        .slice(0, 4)
        .map((p: any) => ({
          position: p.position,
          playerName: p.player?.full_name ?? '',
          photoUrl: p.player?.headshot_override
            ?? getPlayerHeadshotUrl(p.player?.full_name ?? '', PGA_TOUR_SLUG)
            ?? p.player?.photo_url
            ?? null,
          scoreDisplay: p.score != null
            ? p.score === 0 ? 'E' : p.score > 0 ? `+${p.score}` : `${p.score}`
            : '—',
          isTied: lb.filter((x: any) => x.position === p.position).length > 1,
          scoringStats: resultScorecards.length ? aggregateScoringStats(resultScorecards, p.player?.id ?? '') : null,
        }));

      const wonBy = lp && lb[1]
        ? Math.abs((lp.score ?? 0) - (lb[1].score ?? 0))
        : null;
      const wonByText = wonBy == null
        ? null
        : wonBy === 0
        ? 'Won in a playoff'
        : wonBy === 1
        ? 'Won by 1 shot'
        : `Won by ${wonBy} shots`;

      return {
        tournamentId: r.id,
        tournamentName: r.name,
        purse: r.purse,
        state: 'result',
        venueName: r.venue_name,
        venueCity: r.venue_city,
        venuePar: r.venue_par,
        courseImageUrl,
        venueYardage: r.venue_yardage,
        currentRound: 4,
        totalRounds: 4,
        roundLabel: 'Completed',
        leader,
        chasers,
        leaderStats: null,
        insight: wonByText,
        winnerBy: wonByText,
        startDate: r.start_date,
        endDate: r.end_date,
        postId,
        ...eng,
        defendingChampion: null,
        pastWinners: null,
        championSeasonStats: championSeasonStats ? {
          drivingDistance: championSeasonStats.driving_distance,
          drivingAccuracy: championSeasonStats.driving_accuracy,
          greensInReg:     championSeasonStats.greens_in_reg,
          puttingAverage:  championSeasonStats.putting_average,
        } : null,
      };
    }

    // UPCOMING state
    if (nextUpcoming) {
      const u = nextUpcoming as any;
      return {
        tournamentId: u.id,
        tournamentName: u.name,
        purse: u.purse,
        state: 'upcoming',
        venueName: u.venue_name,
        venueCity: u.venue_city,
        venuePar: u.venue_par,
        venueYardage: u.venue_yardage,
        courseImageUrl,
        currentRound: 0,
        totalRounds: 4,
        roundLabel: '',
        leader: null,
        chasers: [],
        leaderStats: null,
        insight: null,
        startDate: u.start_date,
        endDate: u.end_date,
        postId,
        ...eng,
        defendingChampion: u.defending_champion ?? null,
        pastWinners: pastWinnersRaw.length > 0 ? pastWinnersRaw : null,
      };
    }

    return null;
  }, [topLive, recentResult, nextUpcoming, resultLeaderboard, postId,
      engagementData?.likeCount, engagementData?.commentCount, engagementData?.isLikedByMe,
      liveScorecards, resultScorecards, resultMeta, championSeasonStats, courseImageUrl, pastWinnersRaw]);

  const pgaCard: PGACardFeedPost | null = cardData ? {
    id: postId || 'pga-card',
    userId: SYSTEM_USER_ID,
    actorType: 'system',
    actorId: SYSTEM_USER_ID,
    username: 'clbhouz',
    displayName: 'clbhouz',
    avatarUrl: '',
    isVerified: true,
    creatorRelation: 'system' as const,
    caption: '',
    mediaItems: [],
    createdAt: new Date().toISOString(),
    likeCount: cardData.likeCount,
    commentCount: cardData.commentCount,
    shareCount: 0,
    review: null,
    isReview: false,
    isLikedByMe: cardData.isLikedByMe,
    isFollowedByMe: false,
    postType: 'pga_card',
    cardData,
    isLoading: arenaLoading || resultLoading || upcomingLoading,
  } as PGACardFeedPost : null;

  return {
    pgaCard,
    isLoading: arenaLoading || resultLoading || upcomingLoading,
  };
}