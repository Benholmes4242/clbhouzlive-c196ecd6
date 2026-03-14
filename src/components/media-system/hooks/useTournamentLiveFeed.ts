/**
 * useTournamentLiveFeed
 *
 * Wraps useLiveArena and useLeaderboardRealtime to produce
 * TournamentLiveFeedPost objects for injection into the Clubhouse feed.
 */

import { useMemo } from 'react';
import { useLiveArena } from '@/features/tourhub/hooks/useLiveArena';
import { useMultiLeaderboardRealtime } from '@/features/tourhub/hooks/useLeaderboardRealtime';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { TournamentLiveFeedPost, TournamentLiveMeta, LiveLeaderboardEntry } from '../types/media';

const LIVE_CARD_USER_ID = 'system-live-tournament';

export function useTournamentLiveFeed(): {
  livePosts:     TournamentLiveFeedPost[];
  liveTourSlugs: string[];
  isLoading:     boolean;
} {
  const { data: arenaData, isLoading } = useLiveArena();

  const liveIds = useMemo(
    () => (arenaData ?? []).map(t => t.id),
    [arenaData]
  );
  useMultiLeaderboardRealtime(liveIds);

  const livePosts = useMemo((): TournamentLiveFeedPost[] => {
    if (!arenaData?.length) return [];

    return arenaData.map((tournament): TournamentLiveFeedPost => {
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
        .slice(0, 8)
        .map(p => ({
          position:     p.position,
          positionTied: false,
          playerId:     p.playerId,
          playerName:   p.player.fullName,
          photoUrl:     p.player.photoUrl || getPlayerHeadshotUrl(p.player.fullName, tournament.tourSlug) || null,
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
        tourName:        ({ pga: 'PGA TOUR', liv: 'LIV GOLF', euro: 'DP WORLD', lpga: 'LPGA', kft: 'KORN FERRY', champ: 'CHAMPIONS' } as Record<string, string>)[tournament.tourSlug] ?? tournament.tourSlug.toUpperCase(),
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
      };

      return {
        id:              `live-tournament-${tournament.id}`,
        userId:          LIVE_CARD_USER_ID,
        actorType:       'system',
        actorId:         LIVE_CARD_USER_ID,
        username:        'clbhouz',
        displayName:     'clbhouz',
        avatarUrl:       '',
        isVerified:      true,
        creatorRelation: 'system',
        caption:         '',
        mediaItems:      [],
        createdAt:       new Date().toISOString(),
        likeCount:       0,
        commentCount:    0,
        shareCount:      0,
        review:          null,
        isReview:        false,
        isLikedByMe:     false,
        isFollowedByMe:  false,
        postType:        'tournament_live',
        liveMeta:        meta,
      };
    });
  }, [arenaData]);

  const liveTourSlugs = useMemo(
    () => (arenaData ?? []).map(t => t.tourSlug),
    [arenaData]
  );

  return { livePosts, liveTourSlugs, isLoading };
}
