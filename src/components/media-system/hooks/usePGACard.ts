import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { PGACardFeedPost, PGACardData, PGACardLeader, PGACardChaser, PGACardStats } from '../types/media';

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';
const PGA = 'pga';
const RESULT_WINDOW_DAYS = 3;

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

export function usePGACard(userId?: string): {
  pgaCard: PGACardFeedPost | null;
  isLoading: boolean;
} {
  // ── Live tournaments from useLiveArena ──
  const { data: arenaData, isLoading: arenaLoading } = useLiveArena();
  const pgaLive = useMemo(
    () => (arenaData ?? []).filter(t => t.tourSlug === PGA).sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0)),
    [arenaData]
  );
  const topLive = pgaLive[0] ?? null;

  // ── Most recent completed PGA event (within 3 days) ──
  const { data: recentResult, isLoading: resultLoading } = useQuery({
    queryKey: ['pga-card-result'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - RESULT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase
        .from('sr_tournaments') as any)
        .select('id,name,purse,start_date,end_date,venue_name,venue_city,venue_par,venue_yardage,status')
        .eq('tour_slug', PGA)
        .eq('status', 'closed')
        .gte('end_date', cutoff)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });

  // ── Next upcoming PGA event ──
  const { data: nextUpcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['pga-card-upcoming'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase
        .from('sr_tournaments') as any)
        .select('id,name,purse,start_date,end_date,venue_name,venue_city,venue_par,venue_yardage,status')
        .eq('tour_slug', PGA)
        .eq('status', 'scheduled')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
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
    enabled: !!recentResult,
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
        photoUrl: getPlayerHeadshotUrl(lp.player.fullName, PGA, lp.player.headshotOverride) ?? null,
        scoreDisplay: lp.scoreDisplay,
        score: lp.score,
        thru: lp.thru,
        today: null,
      } : null;

      const chasers: PGACardChaser[] = lb
        .filter(p => p && p.position > 1)
        .slice(0, 4)
        .map(p => ({
          position: p!.position,
          playerName: p!.player.fullName,
          photoUrl: getPlayerHeadshotUrl(p!.player.fullName, PGA, p!.player.headshotOverride) ?? null,
          scoreDisplay: p!.scoreDisplay,
          isTied: lb.filter(x => x?.position === p?.position).length > 1,
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
        photoUrl: lp.player?.photo_url ?? lp.player?.headshot_override ?? null,
        scoreDisplay: lp.score != null
          ? lp.score === 0 ? 'E' : lp.score > 0 ? `+${lp.score}` : `${lp.score}`
          : '—',
        score: lp.score ?? 0,
        thru: null,
        today: null,
      } : null;

      const chasers: PGACardChaser[] = lb
        .filter((p: any) => p.position > 1)
        .slice(0, 4)
        .map((p: any) => ({
          position: p.position,
          playerName: p.player?.full_name ?? '',
          photoUrl: p.player?.photo_url ?? p.player?.headshot_override ?? null,
          scoreDisplay: p.score != null
            ? p.score === 0 ? 'E' : p.score > 0 ? `+${p.score}` : `${p.score}`
            : '—',
          isTied: lb.filter((x: any) => x.position === p.position).length > 1,
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
        venueYardage: r.venue_yardage,
        currentRound: 4,
        totalRounds: 4,
        roundLabel: 'Completed',
        leader,
        chasers,
        leaderStats: null,
        insight: wonByText,
        startDate: r.start_date,
        endDate: r.end_date,
        postId,
        ...eng,
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
      };
    }

    return null;
  }, [topLive, recentResult, nextUpcoming, resultLeaderboard, postId,
      engagementData?.likeCount, engagementData?.commentCount, engagementData?.isLikedByMe]);

  const pgaCard: PGACardFeedPost | null = cardData ? {
    id: 'pga-card',
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
  } : null;

  return {
    pgaCard,
    isLoading: arenaLoading || resultLoading || upcomingLoading,
  };
}
