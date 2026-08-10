/**
 * useCompareRecent - THE ONE definition of "who have I played with recently".
 *
 * Extracted so the Circle entry panel (three rows) and the compare sheet's
 * list state (six rows) cannot disagree about who "recent" is, or in what
 * order. Two implementations of this would drift, and this project has already
 * had two surfaces disagree about a leaderboard rank on device.
 *
 * SOURCE: useFriendLeaderboard - the same hook FriendsLeaderboardSection
 * calls with the same argument, so React Query serves it from cache.
 * Self excluded, clbhouz members only, sorted by last_round_played_at.
 *
 * IDENTITY: names and photos come from user_profiles via useCompareIdentities,
 * NEVER from the leaderboard's England Golf friend_name (surname-first). An
 * unresolved member holds a name of null - a shell, never furniture.
 */
import React from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { formatRelativeAgo } from '@/i18n/format';
import { useCompareIdentities } from './useCompareIdentities';
import type { ComparePerson } from './ComparePersonRow';

export interface CompareRecentEntry extends ComparePerson {
  /** ISO date of the most recent round, for callers rendering recency alone. */
  lastPlayedAt: string | null;
  lastCourseName: string | null;
}

export function useCompareRecent(
  viewerUserId: string | undefined,
  limit: number,
  enabled = true,
): CompareRecentEntry[] {
  const { data: leaderboard } = useFriendLeaderboard(viewerUserId);

  const rows = React.useMemo(
    () =>
      (leaderboard ?? [])
        .filter((e) => !e.is_self && !!e.friend_user_id && e.is_clbhouz_user)
        .sort((a, b) =>
          (b.last_round_played_at ?? '').localeCompare(a.last_round_played_at ?? ''),
        )
        .slice(0, limit),
    [leaderboard, limit],
  );

  const { data: identities } = useCompareIdentities(
    rows.map((e) => e.friend_user_id as string),
    enabled,
  );

  return React.useMemo<CompareRecentEntry[]>(
    () =>
      rows.map((e) => {
        const id = identities?.[e.friend_user_id as string];
        return {
          userId: e.friend_user_id as string,
          name: id?.name ?? null,
          avatarUrl: id?.avatarUrl ?? e.friend_profile_photo_url ?? null,
          index: e.friend_handicap_index,
          lastPlayedAt: e.last_round_played_at ?? null,
          lastCourseName: e.last_round_course_name ?? null,
          contextLine:
            [
              e.last_round_played_at
                ? formatRelativeAgo(e.last_round_played_at, { yesterday: true })
                : '',
              e.last_round_course_name ?? '',
            ]
              .filter(Boolean)
              .join(' . ') || null,
        };
      }),
    [rows, identities],
  );
}
