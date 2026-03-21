/**
 * useTournamentLiveFeed
 *
 * Wraps useLiveArena and useLeaderboardRealtime to produce
 * TournamentLiveFeedPost objects for injection into the Clubhouse feed.
 *
 * Each live tournament gets a real DB post (upserted once) so that
 * comments, likes, etc. work with valid UUIDs.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { useMultiLeaderboardRealtime } from '@/features/tourhub/hooks/useLeaderboardRealtime';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { TournamentLiveFeedPost, TournamentLiveMeta, LiveLeaderboardEntry } from '../types/media';

const TOUR_PRIORITY: Record<string, number> = {
  pga:   1,
  liv:   2,
  euro:  3,
  dpw:   3,
  lpga:  4,
  champ: 5,
  kft:   6,
};

const TOUR_DISPLAY_LABELS: Record<string, string> = {
  pga: 'PGA TOUR', liv: 'LIV GOLF', euro: 'DP WORLD',
  lpga: 'LPGA', kft: 'KORN FERRY', champ: 'CHAMPIONS',
};

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';

/**
 * Get or create a real DB post for a live tournament so comments attach
 * to a valid UUID. Uses `content` field to store tournament_id as a
 * lookup key — avoids needing a separate junction table.
 */
async function getOrCreateLivePost(tournamentId: string, tournamentName: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('upsert-live-tournament-post', {
      body: { tournamentId, tournamentName },
    });

    if (error || !data?.postId) {
      console.warn('[useTournamentLiveFeed] Edge function failed:', error);
      return crypto.randomUUID(); // graceful fallback — card shows but comments won't persist
    }

    return data.postId;
  } catch (err) {
    console.warn('[useTournamentLiveFeed] Could not create live post:', err);
    return crypto.randomUUID();
  }
}

export function useTournamentLiveFeed(userId?: string): {
  livePosts:     TournamentLiveFeedPost[];
  liveTourSlugs: string[];
  isLoading:     boolean;
} {
  const { data: arenaData, isLoading: arenaLoading } = useLiveArena();

  const liveIds = useMemo(
    () => (arenaData ?? []).map(t => t.id),
    [arenaData]
  );
  useMultiLeaderboardRealtime(liveIds);

  // Fetch or create real post IDs for each live tournament
  const postIdsQuery = useQuery({
    queryKey: ['live-tournament-post-ids', liveIds.join(',')],
    queryFn:  async () => {
      if (!liveIds.length) return {} as Record<string, string>;
      const entries = await Promise.all(
        (arenaData ?? []).map(async t => {
          const postId = await getOrCreateLivePost(t.id, t.name);
          return [t.id, postId] as [string, string];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled:   !!arenaData?.length,
    staleTime: 5 * 60_000,
    retry:     false,
  });

  const postIdMap = postIdsQuery.data ?? {};

  // Fetch live like/comment counts for all real post IDs.
  const realPostIds = Object.values(postIdMap).filter(Boolean);

  const liveCountsQuery = useQuery({
    queryKey: ['live-tournament-counts', realPostIds.join(','), userId],
    queryFn: async (): Promise<Record<string, { likeCount: number; commentCount: number; isLikedByMe: boolean }>> => {
      if (!realPostIds.length) return {};

      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('post_id, user_id')
          .in('post_id', realPostIds),
        supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', realPostIds),
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

  // Stable fingerprint so livePosts memo only rebuilds when counts actually change
  const liveCountsKey = useMemo(
    () => Object.entries(liveCountsMap)
      .map(([id, c]) => `${id}:${c.likeCount}:${c.commentCount}`)
      .sort().join('|'),
    [liveCountsMap]
  );

  const livePosts = useMemo((): TournamentLiveFeedPost[] => {
    if (!arenaData?.length) return [];

    // Filter to PGA only, pick the highest-purse tournament
    const pgaTournaments = arenaData.filter(t => t.tourSlug === 'pga');
    if (!pgaTournaments.length) return [];
    const selected = pgaTournaments.reduce((best, t) =>
      (t.purse ?? 0) >= (best.purse ?? 0) ? t : best
    );

    const tournament = selected;
    const allPlayers = [
      ...(tournament.leader ? [tournament.leader] : []),
      ...tournament.chasePack,
    ];

    const seen = new Set<string>();
    const leaderboard: LiveLeaderboardEntry[] = allPlayers
      .filter(p => {
        if (seen.has(p.playerId)) return false;
        seen.add(p.playerId);
        return true;
      })
      .sort((a, b) => a.position - b.position)
      .slice(0, 10)
      .map(p => ({
        position:     p.position,
        positionTied: false,
        playerId:     p.playerId,
        playerName:   p.player.fullName,
        photoUrl:     getPlayerHeadshotUrl(
          p.player.fullName,
          p.player.tourCode ?? tournament.tourSlug,
          p.player.headshotOverride
        ) || null,
        country:      p.player.country,
        scoreDisplay: p.scoreDisplay,
        score:        p.score,
        thru:         p.thru,
        today:        null,
      }));

    const meta: TournamentLiveMeta = {
      tournamentId:    tournament.id,
      tournamentName:  tournament.name,
      tourSlug:        tournament.tourSlug,
      tourName:        TOUR_DISPLAY_LABELS[tournament.tourSlug] ?? tournament.tourSlug.toUpperCase(),
      venueName:       tournament.venueName,
      venueCity:       tournament.venueCity,
      currentRound:    tournament.currentRound ?? 1,
      totalRounds:     tournament.totalRounds,
      momentumTags:    tournament.momentumTags,
      volatilityIndex: tournament.volatilityIndex,
      scoreSpread:     tournament.scoreSpread,
      leader:          leaderboard[0] ?? null,
      leaderboard,
      lastUpdated:     new Date().toISOString(),
      tourPriority:    TOUR_PRIORITY[tournament.tourSlug] ?? 99,
      leaderStats:     tournament.leaderStats ?? null,
    };

    const realPostId = postIdMap[tournament.id];
    if (!realPostId) return [];

    const counts = liveCountsMap[realPostId] ?? {
      likeCount: 0,
      commentCount: 0,
      isLikedByMe: false,
    };

    const card: TournamentLiveFeedPost = {
      id:              realPostId,
      userId:          SYSTEM_USER_ID,
      actorType:       'system',
      actorId:         SYSTEM_USER_ID,
      username:        'clbhouz',
      displayName:     'clbhouz',
      avatarUrl:       '',
      isVerified:      true,
      creatorRelation: 'system',
      caption:         '',
      mediaItems:      [],
      createdAt:       new Date().toISOString(),
      likeCount:       counts.likeCount,
      commentCount:    counts.commentCount,
      shareCount:      0,
      review:          null,
      isReview:        false,
      isLikedByMe:     counts.isLikedByMe,
      isFollowedByMe:  false,
      postType:        'tournament_live',
      liveMeta:        meta,
    };

    return [card];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaData, postIdMap, liveCountsKey]);

  const liveTourSlugs = useMemo(
    () => (arenaData ?? []).map(t => t.tourSlug),
    [arenaData]
  );

  return {
    livePosts,
    liveTourSlugs,
    isLoading: arenaLoading || postIdsQuery.isLoading || liveCountsQuery.isLoading,
  };
}
