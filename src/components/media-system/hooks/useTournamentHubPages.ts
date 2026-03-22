import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type {
  TournamentHubFeedPost,
  TournamentHubPage,
  TournamentHubLeader,
  TournamentHubChaser,
} from '../types/media';

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';
const PGA_SLUG = 'pga';

async function getOrCreateHubPost(tournamentId: string, tournamentName: string): Promise<string> {
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

function volatilityInsight(
  volatilityIndex: number,
  leaderName: string | null,
  isTied: boolean,
  tiedCount: number,
): string {
  const last = leaderName?.split(' ').pop() ?? 'The leader';
  if (isTied && tiedCount >= 3) return `${tiedCount}-way tie at the top.`;
  if (isTied && tiedCount === 2) return `All square at the top.`;
  if (volatilityIndex >= 80) return 'Tight race — anyone can make a move.';
  if (volatilityIndex >= 60) return 'The field is closing in. Expect drama.';
  if (volatilityIndex <= 25) return `${last} is in full control.`;
  return `${last} leads. The chasers need to move soon.`;
}

export function useTournamentHubPages(userId?: string): {
  hubPost: TournamentHubFeedPost | null;
  isLoading: boolean;
} {
  // ── Live PGA Tournaments from useLiveArena ──
  const { data: arenaData, isLoading: arenaLoading } = useLiveArena();
  const pgaLive = useMemo(() => (arenaData ?? []).filter(t => t.tourSlug === PGA_SLUG), [arenaData]);

  // ── Recent Completed PGA Tournaments (last 7 days) ──
  const { data: pgaResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['tournament-hub-results-pga'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, tour_slug, purse, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage')
        .eq('status', 'closed')
        .eq('tour_slug', PGA_SLUG)
        .gte('end_date', sevenDaysAgo)
        .order('end_date', { ascending: false })
        .limit(3);
      return (data ?? []) as any[];
    },
    staleTime: 5 * 60_000,
  });

  // ── Upcoming PGA Tournaments (next 21 days) ──
  const { data: pgaUpcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['tournament-hub-upcoming-pga'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const twentyOneDays = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, tour_slug, purse, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage')
        .eq('status', 'scheduled')
        .eq('tour_slug', PGA_SLUG)
        .gte('start_date', now)
        .lte('start_date', twentyOneDays)
        .order('start_date', { ascending: true })
        .limit(2);
      return data ?? [];
    },
    staleTime: 30 * 60_000,
  });

  // ── Get post IDs for all tournaments ──
  const allTournamentIds = useMemo(
    () => [
      ...pgaLive.map(t => t.id),
      ...(pgaResults ?? []).map((t: any) => t.id),
      ...(pgaUpcoming ?? []).map((t: any) => t.id),
    ],
    [pgaLive, pgaResults, pgaUpcoming],
  );

  const postIdQuery = useQuery({
    queryKey: ['tournament-hub-post-ids', allTournamentIds.join(',')],
    queryFn: async () => {
      if (!allTournamentIds.length) return {} as Record<string, string>;
      const allData = [...pgaLive, ...(pgaResults ?? []), ...(pgaUpcoming ?? [])] as any[];
      const entries = await Promise.all(
        allData.map(async t => {
          const postId = await getOrCreateHubPost(t.id, t.name);
          return [t.id, postId] as [string, string];
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: allTournamentIds.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const postIdMap = postIdQuery.data ?? {};

  // ── Fetch like/comment counts ──
  const realPostIds = Object.values(postIdMap).filter(Boolean);
  const countsQuery = useQuery({
    queryKey: ['tournament-hub-counts', realPostIds.join(','), userId],
    queryFn: async () => {
      if (!realPostIds.length) return {} as Record<string, { likeCount: number; commentCount: number; isLikedByMe: boolean }>;
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('post_likes').select('post_id, user_id').in('post_id', realPostIds),
        supabase.from('post_comments').select('post_id').in('post_id', realPostIds),
      ]);
      const likes = likesRes.data ?? [];
      const comments = commentsRes.data ?? [];
      const counts: Record<string, { likeCount: number; commentCount: number; isLikedByMe: boolean }> = {};
      for (const postId of realPostIds) {
        counts[postId] = {
          likeCount: likes.filter(l => l.post_id === postId).length,
          commentCount: comments.filter(c => c.post_id === postId).length,
          isLikedByMe: userId ? likes.some(l => l.post_id === postId && l.user_id === userId) : false,
        };
      }
      return counts;
    },
    enabled: realPostIds.length > 0,
    staleTime: 30_000,
  });
  const countsMap = countsQuery.data ?? {};

  // ── Build pages ──
  const pages = useMemo((): TournamentHubPage[] => {
    const result: TournamentHubPage[] = [];

    // ── LIVE pages ──
    const sortedLive = [...pgaLive].sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0));
    for (const t of sortedLive) {
      const postId = postIdMap[t.id] ?? '';
      const counts = countsMap[postId] ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };

      const allPlayers = [t.leader, ...t.chasePack].filter(Boolean);
      const seen = new Set<string>();
      const leaderboard = allPlayers
        .filter(p => {
          if (seen.has(p!.playerId)) return false;
          seen.add(p!.playerId);
          return true;
        })
        .sort((a, b) => a!.position - b!.position)
        .slice(0, 10);

      const leaderPlayer = leaderboard[0] ?? null;
      const coLeaders = leaderboard.filter(p => p?.position === 1);
      const isTied = coLeaders.length > 1;

      const leader: TournamentHubLeader | null = leaderPlayer
        ? {
            playerId: leaderPlayer.playerId,
            playerName: leaderPlayer.player.fullName,
            photoUrl:
              getPlayerHeadshotUrl(leaderPlayer.player.fullName, PGA_SLUG, leaderPlayer.player.headshotOverride) || null,
            scoreDisplay: leaderPlayer.scoreDisplay,
            score: leaderPlayer.score,
            thru: leaderPlayer.thru,
            today: null,
          }
        : null;

      const chasers: TournamentHubChaser[] = leaderboard
        .filter(p => p && p.position > 1)
        .slice(0, 4)
        .map(p => ({
          position: p!.position,
          playerName: p!.player.fullName,
          photoUrl: getPlayerHeadshotUrl(p!.player.fullName, PGA_SLUG, p!.player.headshotOverride) || null,
          scoreDisplay: p!.scoreDisplay,
          isTied: leaderboard.filter(x => x?.position === p?.position).length > 1,
        }));

      const insight = volatilityInsight(t.volatilityIndex, leader?.playerName ?? null, isTied, coLeaders.length);

      const rawStats = t.leaderStats;
      const leaderStats = rawStats ? {
        totalEagles: rawStats.totalEagles,
        totalBirdies: rawStats.totalBirdies,
        totalPars: rawStats.totalPars,
        totalBogeys: rawStats.totalBogeys,
        drivingDistance: rawStats.drivingDistance ?? null,
        drivingAccuracy: rawStats.drivingAccuracy ?? null,
        greensInReg: rawStats.greensInReg ?? null,
        puttingAverage: rawStats.puttingAverage ?? null,
      } : null;

      result.push({
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: PGA_SLUG,
        tourName: 'PGA TOUR',
        purse: t.purse,
        state: 'live',
        venueName: t.venueName,
        venueCity: t.venueCity,
        venuePar: t.venuePar,
        venueYardage: t.venueYardage,
        currentRound: t.currentRound ?? 1,
        totalRounds: t.totalRounds,
        leader,
        chasers,
        leaderStats,
        insight,
        startDate: t.startDate,
        endDate: t.endDate,
        defendingChamp: null,
        defendingScore: null,
        postId,
        ...counts,
      });
    }

    // ── RESULT pages ──
    for (const t of (pgaResults ?? []) as any[]) {
      const postId = postIdMap[t.id] ?? '';
      const counts = countsMap[postId] ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };
      result.push({
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: PGA_SLUG,
        tourName: 'PGA TOUR',
        purse: t.purse,
        state: 'result',
        venueName: t.venue_name,
        venueCity: t.venue_city,
        venuePar: t.venue_par,
        venueYardage: t.venue_yardage,
        currentRound: 4,
        totalRounds: 4,
        leader: null,
        chasers: [],
        leaderStats: null,
        insight: null,
        startDate: t.start_date,
        endDate: t.end_date,
        defendingChamp: null,
        defendingScore: null,
        postId,
        ...counts,
      });
    }

    // ── UPCOMING pages ──
    for (const t of (pgaUpcoming ?? []) as any[]) {
      const postId = crypto.randomUUID();
      result.push({
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: PGA_SLUG,
        tourName: 'PGA TOUR',
        purse: t.purse,
        state: 'upcoming',
        venueName: t.venue_name,
        venueCity: t.venue_city,
        venuePar: t.venue_par,
        venueYardage: t.venue_yardage,
        currentRound: 0,
        totalRounds: 4,
        leader: null,
        chasers: [],
        leaderStats: null,
        insight: null,
        startDate: t.start_date,
        endDate: t.end_date,
        defendingChamp: null,
        defendingScore: null,
        postId,
        likeCount: 0,
        commentCount: 0,
        isLikedByMe: false,
      });
    }

    return result;
  }, [pgaLive, pgaResults, pgaUpcoming, postIdMap, countsMap]);

  // ── Hub Post ──
  const hubPost: TournamentHubFeedPost | null =
    pages.length === 0
      ? null
      : {
          id: 'tournament-hub-pga',
          userId: SYSTEM_USER_ID,
          actorType: 'system',
          actorId: SYSTEM_USER_ID,
          username: 'clbhouz',
          displayName: 'clbhouz',
          avatarUrl: '',
          isVerified: true,
          creatorRelation: 'system',
          caption: '',
          mediaItems: [],
          createdAt: new Date().toISOString(),
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          review: null,
          isReview: false,
          isLikedByMe: false,
          isFollowedByMe: false,
          postType: 'tournament_hub',
          pages,
        };

  return {
    hubPost,
    isLoading: arenaLoading || resultsLoading || upcomingLoading,
  };
}
