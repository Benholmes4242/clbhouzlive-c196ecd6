/**
 * useTournamentHubPages
 *
 * Replaces useTournamentLiveFeed. Returns a single TournamentHubFeedPost
 * containing all live, result, and upcoming tournament pages sorted by
 * tour priority and purse.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { useMultiLeaderboardRealtime } from '@/features/tourhub/hooks/useLeaderboardRealtime';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { TournamentHubFeedPost, LiveLeaderboardEntry, TournamentLiveMeta } from '../types/media';
import type { TournamentHubPage } from '../types/TournamentHubPage';

const TOUR_PRIORITY: Record<string, number> = {
  pga: 1, liv: 2, euro: 3, dpw: 3, lpga: 4, champ: 5, kft: 6,
};

const TOUR_DISPLAY_LABELS: Record<string, string> = {
  pga: 'PGA TOUR', liv: 'LIV GOLF', euro: 'DP WORLD',
  dpw: 'DP WORLD', lpga: 'LPGA', kft: 'KORN FERRY', champ: 'CHAMPIONS',
};

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';

/** Derive tour slug from tournament name / event_type */
function deriveTourSlug(name: string, eventType?: string): string {
  const n = (name || '').toLowerCase();
  const e = (eventType || '').toLowerCase();
  if (n.includes('liv golf') || n.includes('liv')) return 'liv';
  if (n.includes('lpga')) return 'lpga';
  if (n.includes('korn ferry') || n.includes('kft')) return 'kft';
  if (n.includes('dp world') || n.includes('european tour')) return 'euro';
  if (n.includes('pga tour champions') || n === 'champions tour') return 'champ';
  if (e.includes('liv')) return 'liv';
  if (e.includes('european') || e.includes('dp')) return 'euro';
  if (e.includes('lpga')) return 'lpga';
  if (e.includes('champions')) return 'champ';
  return 'pga';
}

/** Volatility insight text */
function volatilityInsight(
  volatilityIndex: number,
  leader: LiveLeaderboardEntry | null,
  leaderboard: LiveLeaderboardEntry[],
): string {
  const lastName = leader?.playerName.split(' ').pop() ?? 'The leader';
  const coLeaders = leaderboard.filter(e => e.position === 1);
  if (coLeaders.length >= 3) return `${coLeaders.length}-way tie at the top.`;
  if (coLeaders.length === 2) {
    const other = coLeaders.find(e => e.playerName !== leader?.playerName);
    return `${lastName} and ${other?.playerName.split(' ').pop()} in a duel.`;
  }
  if (volatilityIndex >= 80) return 'Tight race — anyone can make a move.';
  if (volatilityIndex >= 60) return 'The field is closing in. Expect drama.';
  if (volatilityIndex <= 25) return `${lastName} is in full control.`;
  return `${lastName} leads. The chasers need to move soon.`;
}

async function getOrCreateLivePost(tournamentId: string, tournamentName: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('upsert-live-tournament-post', {
      body: { tournamentId, tournamentName },
    });
    if (error || !data?.postId) {
      console.warn('[useTournamentHubPages] Edge function failed:', error);
      return crypto.randomUUID();
    }
    return data.postId;
  } catch (err) {
    console.warn('[useTournamentHubPages] Could not create live post:', err);
    return crypto.randomUUID();
  }
}

export function useTournamentHubPages(userId?: string): {
  hubPost: TournamentHubFeedPost | null;
  isLoading: boolean;
} {
  const { data: arenaData, isLoading: arenaLoading } = useLiveArena();

  // Subscribe to realtime updates for all live tournaments
  const liveIds = useMemo(() => (arenaData ?? []).map(t => t.id), [arenaData]);
  useMultiLeaderboardRealtime(liveIds);

  // Fetch recently completed tournaments (last 7 days)
  const { data: recentResults } = useQuery({
    queryKey: ['tournament-hub-results'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, purse, status, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage, event_type')
        .eq('status', 'closed')
        .gte('end_date', sevenDaysAgo)
        .order('end_date', { ascending: false });
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  // Fetch upcoming tournaments (next 14 days)
  const { data: upcomingData } = useQuery({
    queryKey: ['tournament-hub-upcoming'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const fourteenDays = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('sr_tournaments')
        .select('id, name, tour_slug, purse, status, start_date, end_date, venue_name, venue_city, venue_par, venue_yardage, event_type')
        .eq('status', 'scheduled')
        .gte('start_date', now)
        .lte('start_date', fourteenDays)
        .order('start_date', { ascending: true });
      return data ?? [];
    },
    staleTime: 30 * 60_000,
  });

  // Collect all tournament IDs for post creation
  const allTournamentIds = useMemo(() => {
    const ids: { id: string; name: string }[] = [];
    (arenaData ?? []).forEach(t => ids.push({ id: t.id, name: t.name }));
    (recentResults ?? []).forEach(t => ids.push({ id: t.id, name: t.name }));
    (upcomingData ?? []).forEach(t => ids.push({ id: t.id, name: t.name }));
    return ids;
  }, [arenaData, recentResults, upcomingData]);

  const allIdsKey = useMemo(() => allTournamentIds.map(t => t.id).sort().join(','), [allTournamentIds]);

  // Get or create post IDs
  const postIdsQuery = useQuery({
    queryKey: ['tournament-hub-post-ids', allIdsKey],
    queryFn: async () => {
      if (!allTournamentIds.length) return {} as Record<string, string>;
      const entries = await Promise.all(
        allTournamentIds.map(async t => {
          const postId = await getOrCreateLivePost(t.id, t.name);
          return [t.id, postId] as [string, string];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: allTournamentIds.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const postIdMap = postIdsQuery.data ?? {};

  // Fetch live like/comment counts
  const realPostIds = useMemo(() => Object.values(postIdMap).filter(Boolean), [postIdMap]);

  const liveCountsQuery = useQuery({
    queryKey: ['tournament-hub-counts', realPostIds.join(','), userId],
    queryFn: async (): Promise<Record<string, { likeCount: number; commentCount: number; isLikedByMe: boolean }>> => {
      if (!realPostIds.length) return {};
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from('post_likes').select('post_id, user_id').in('post_id', realPostIds),
        supabase.from('post_comments').select('post_id').in('post_id', realPostIds),
      ]);
      const likes = likesResult.data ?? [];
      const comments = commentsResult.data ?? [];
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

  const liveCountsMap = liveCountsQuery.data ?? {};

  const liveCountsKey = useMemo(
    () => Object.entries(liveCountsMap).map(([id, c]) => `${id}:${c.likeCount}:${c.commentCount}`).sort().join('|'),
    [liveCountsMap]
  );

  const pages = useMemo((): TournamentHubPage[] => {
    // Build live pages
    const livePages: TournamentHubPage[] = (arenaData ?? []).map(t => {
      const allPlayers = [
        ...(t.leader ? [t.leader] : []),
        ...t.chasePack,
      ];
      const seen = new Set<string>();
      const leaderboard: LiveLeaderboardEntry[] = allPlayers
        .filter(p => { if (seen.has(p.playerId)) return false; seen.add(p.playerId); return true; })
        .sort((a, b) => a.position - b.position)
        .slice(0, 10)
        .map(p => ({
          position: p.position,
          positionTied: false,
          playerId: p.playerId,
          playerName: p.player.fullName,
          photoUrl: getPlayerHeadshotUrl(p.player.fullName, p.player.tourCode ?? t.tourSlug, p.player.headshotOverride) || null,
          country: p.player.country,
          scoreDisplay: p.scoreDisplay,
          score: p.score,
          thru: p.thru,
          today: null,
        }));

      const realPostId = postIdMap[t.id] ?? '';
      const counts = liveCountsMap[realPostId] ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };

      return {
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: t.tourSlug,
        tourName: TOUR_DISPLAY_LABELS[t.tourSlug] ?? t.tourSlug.toUpperCase(),
        tourPriority: TOUR_PRIORITY[t.tourSlug] ?? 99,
        purse: t.purse,
        state: 'live' as const,
        venueName: t.venueName,
        venueCity: t.venueCity,
        venuePar: t.venuePar,
        venueYardage: t.venueYardage,
        currentRound: t.currentRound ?? 1,
        totalRounds: t.totalRounds,
        leader: leaderboard[0] ?? null,
        leaderboard,
        volatilityIndex: t.volatilityIndex,
        momentumTags: t.momentumTags,
        leaderStats: t.leaderStats ?? null,
        insight: volatilityInsight(t.volatilityIndex, leaderboard[0] ?? null, leaderboard),
        startDate: t.startDate,
        endDate: t.endDate,
        postId: realPostId,
        likeCount: counts.likeCount,
        commentCount: counts.commentCount,
        isLikedByMe: counts.isLikedByMe,
      };
    });

    // Build result pages
    const resultPages: TournamentHubPage[] = (recentResults ?? []).map(t => {
      const slug = t.tour_slug || deriveTourSlug(t.name, (t as any).event_type);
      const realPostId = postIdMap[t.id] ?? '';
      const counts = liveCountsMap[realPostId] ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };
      return {
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: slug,
        tourName: TOUR_DISPLAY_LABELS[slug] ?? slug.toUpperCase(),
        tourPriority: TOUR_PRIORITY[slug] ?? 99,
        purse: t.purse,
        state: 'result' as const,
        venueName: t.venue_name,
        venueCity: t.venue_city,
        venuePar: t.venue_par,
        venueYardage: t.venue_yardage,
        currentRound: 4,
        totalRounds: 4,
        leader: null,
        leaderboard: [],
        volatilityIndex: 0,
        momentumTags: [],
        leaderStats: null,
        insight: null,
        startDate: t.start_date,
        endDate: t.end_date,
        postId: realPostId,
        likeCount: counts.likeCount,
        commentCount: counts.commentCount,
        isLikedByMe: counts.isLikedByMe,
      };
    });

    // Build upcoming pages
    const upcomingPages: TournamentHubPage[] = (upcomingData ?? []).map(t => {
      const slug = t.tour_slug || deriveTourSlug(t.name, (t as any).event_type);
      const realPostId = postIdMap[t.id] ?? '';
      const counts = liveCountsMap[realPostId] ?? { likeCount: 0, commentCount: 0, isLikedByMe: false };
      return {
        tournamentId: t.id,
        tournamentName: t.name,
        tourSlug: slug,
        tourName: TOUR_DISPLAY_LABELS[slug] ?? slug.toUpperCase(),
        tourPriority: TOUR_PRIORITY[slug] ?? 99,
        purse: t.purse,
        state: 'upcoming' as const,
        venueName: t.venue_name,
        venueCity: t.venue_city,
        venuePar: t.venue_par,
        venueYardage: t.venue_yardage,
        currentRound: 0,
        totalRounds: 4,
        leader: null,
        leaderboard: [],
        volatilityIndex: 0,
        momentumTags: [],
        leaderStats: null,
        insight: null,
        startDate: t.start_date,
        endDate: t.end_date,
        postId: realPostId,
        likeCount: counts.likeCount,
        commentCount: counts.commentCount,
        isLikedByMe: counts.isLikedByMe,
      };
    });

    const sortPages = (arr: TournamentHubPage[]) =>
      arr.sort((a, b) => {
        if (a.tourPriority !== b.tourPriority) return a.tourPriority - b.tourPriority;
        return (b.purse ?? 0) - (a.purse ?? 0);
      });

    return [...sortPages(livePages), ...sortPages(resultPages), ...sortPages(upcomingPages)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaData, recentResults, upcomingData, postIdMap, liveCountsKey]);

  const hubPost: TournamentHubFeedPost | null = pages.length === 0 ? null : {
    id: 'tournament-hub-card',
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

  return { hubPost, isLoading: arenaLoading };
}
