/** IF1 ordering is sheet-local: never mutate useInvitableFriends' Circle order.
 * Reminder eligibility is elapsed seven days, not calendar-week membership.
 * Relative labels expand the shared formatter without changing other readers. */
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import { displayName } from '@/lib/whs/utils/initials';
export const normalizeInviteClub = (name: string) => name.toLowerCase().replace(/\bgolf\s+club\b|\bgc\b/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const playedAt = (friend: FriendLeaderboardEntry) => friend.last_round_played_at ? new Date(friend.last_round_played_at).getTime() : -Infinity;
export function groupInviteFriends(pending: FriendLeaderboardEntry[], invited: FriendLeaderboardEntry[], homeClub: string | null, alreadyFor: (friend: FriendLeaderboardEntry) => { created_at: string } | undefined, query = '') {
  const key = homeClub ? normalizeInviteClub(homeClub) : '';
  const clubMatch = (friend: FriendLeaderboardEntry) => !!key && normalizeInviteClub(friend.friend_home_club ?? '') === key;
  const byRound = (a: FriendLeaderboardEntry, b: FriendLeaderboardEntry) => playedAt(b) - playedAt(a);
  const search = (friend: FriendLeaderboardEntry) => displayName(friend.friend_name).toLowerCase().includes(query.trim().toLowerCase());
  return {
    club: pending.filter(clubMatch).sort(byRound).filter(search),
    playing: pending.filter(friend => !clubMatch(friend)).sort((a,b) => b.rounds_last_30d - a.rounds_last_30d || byRound(a,b) || (a.friend_handicap_index ?? Infinity) - (b.friend_handicap_index ?? Infinity)).filter(search),
    invited: [...invited].sort((a,b) => new Date(alreadyFor(b)?.created_at ?? 0).getTime() - new Date(alreadyFor(a)?.created_at ?? 0).getTime()).filter(search),
  };
}
export function inviteRelative(iso: string | null | undefined, played = false) {
  if (!iso) return '';
  const shared = fmtRelative(iso, { compact: false });
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (played && days === 0) return 'today';
  if (played && days === 1) return 'yesterday';
  if (shared === 'just now') return shared;
  if (days === 0) { const hours = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)); return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`; }
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
export function inviteCanRemind(createdAt: string, now = Date.now()) { return now - new Date(createdAt).getTime() >= 7 * 86400000; }
export function invitePendingMeta(friend: FriendLeaderboardEntry, clubGroup: boolean) {
  const hcp = friend.friend_handicap_index == null ? '' : fmtHcp(friend.friend_handicap_index);
  const rounds = friend.rounds_last_30d;
  if (rounds > 0) return { text: [hcp, `${rounds} ${rounds === 1 ? 'round' : 'rounds'} this month`].filter(Boolean).join(' · '), fall: friend.handicap_30d_delta != null && friend.handicap_30d_delta < 0 ? Math.abs(friend.handicap_30d_delta).toFixed(1) : null };
  return { text: (clubGroup ? [hcp, friend.last_round_played_at ? `played ${inviteRelative(friend.last_round_played_at,true)}` : ''] : [friend.friend_home_club, hcp]).filter(Boolean).join(' · '), fall: null };
}