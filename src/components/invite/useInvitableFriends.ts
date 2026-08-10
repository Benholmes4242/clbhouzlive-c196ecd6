/**
 * useInvitableFriends - THE ONE definition of "who can I invite to clbhouz,
 * and who have I already invited".
 *
 * BRIEF_CIRCLE_INVITE_ENTRY (D1): the Circle entry counted invites with
 * useSentInvites().length (every invite ever sent) while InviteFriendsSheet
 * counted invitable friends holding a sent invite. The two diverged exactly
 * when an invite SUCCEEDED and the invitee left the invitable set. Both
 * surfaces now read this hook, so they cannot disagree.
 *
 * INVITABLE means: an England Golf friend who is NOT on clbhouz AND holds a
 * passport id. callCreateInvite needs the passport id, so a friend without one
 * can never be invited and must never render an invite action.
 *
 * ORDER: most recent round first, then lowest handicap. Same order the sheet
 * has always used, preserved here so the entry's three rows are the sheet's
 * own first three.
 */
import { useCallback, useMemo } from 'react';
import { useFriendLeaderboard, useSentInvites } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry, WhsInviteStatus } from '@/lib/whs/types';

export interface SentInviteMark {
  created_at: string;
}

export interface InvitableFriends {
  /** Not on clbhouz, has a passport id, sorted recency then handicap. */
  invitable: FriendLeaderboardEntry[];
  /** Undefined when no invite has been sent to that friend. */
  alreadyFor: (f: FriendLeaderboardEntry) => SentInviteMark | undefined;
  /** Invitable, not yet invited - in invitable order. */
  pending: FriendLeaderboardEntry[];
  /** Invitable, already invited - in invitable order. */
  invited: FriendLeaderboardEntry[];
  /** invited.length. The figure both surfaces show. */
  invitedTotal: number;
}

export function useInvitableFriends(ownerUserId: string | undefined): InvitableFriends {
  const { data: friends } = useFriendLeaderboard(ownerUserId);
  const { data: sent } = useSentInvites();

  const invitable = useMemo(
    () =>
      (friends ?? [])
        .filter((f) => !f.is_clbhouz_user && f.friend_passport_id != null)
        .sort((a, b) => {
          const aT = a.last_round_played_at ? new Date(a.last_round_played_at).getTime() : -Infinity;
          const bT = b.last_round_played_at ? new Date(b.last_round_played_at).getTime() : -Infinity;
          if (aT !== bT) return bT - aT;
          return (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99);
        }),
    [friends],
  );

  const sentByPassportId = useMemo(() => {
    const map = new Map<string, SentInviteMark>();
    (sent ?? []).forEach((s: WhsInviteStatus) => {
      if (s.invitee_passport_id) map.set(String(s.invitee_passport_id), { created_at: s.sent_at });
    });
    return map;
  }, [sent]);

  const alreadyFor = useCallback(
    (f: FriendLeaderboardEntry) =>
      f.friend_passport_id != null ? sentByPassportId.get(String(f.friend_passport_id)) : undefined,
    [sentByPassportId],
  );

  const pending = useMemo(() => invitable.filter((f) => !alreadyFor(f)), [invitable, alreadyFor]);
  const invited = useMemo(() => invitable.filter((f) => !!alreadyFor(f)), [invitable, alreadyFor]);

  return { invitable, alreadyFor, pending, invited, invitedTotal: invited.length };
}
