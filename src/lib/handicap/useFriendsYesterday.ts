/**
 * useFriendsYesterday — surfaces WHS-connected friends who posted a round
 * with play_date == yesterday (in the user's local timezone).
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFriendsActivity } from '@/lib/whs/api';
// score field is non-null in the result because we filter null grosses out below.

export interface FriendYesterday {
  user_id: string | null;
  name: string;
  thumbnail_url: string | null;
  initial: string;
  score: number;
  course_name: string;
}

export interface FriendsYesterdayResult {
  friends: FriendYesterday[];
  count: number;
  best: FriendYesterday | null;
}

function toLocalDateKey(d: Date | string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateKey(d)!;
}

export function useFriendsYesterday(ownerUserId: string) {
  return useQuery<FriendsYesterdayResult>({
    queryKey: ['friends-yesterday', ownerUserId, getYesterdayKey()],
    enabled: !!ownerUserId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const activity = await fetchFriendsActivity(ownerUserId, 50);
      const yesterday = getYesterdayKey();

      const playedYesterday = activity.filter((f) => {
        const playedDate = toLocalDateKey(f.last_round_played_at);
        if (playedDate !== yesterday) return false;
        // Filter out friends without a real gross score — they don't belong
        // in the "shot X — best of the group" standout line.
        if (
          f.last_round_adjusted_gross === null ||
          f.last_round_adjusted_gross === undefined
        ) {
          return false;
        }
        return true;
      });

      playedYesterday.sort((a, b) => {
        const ga = a.last_round_adjusted_gross ?? Number.MAX_SAFE_INTEGER;
        const gb = b.last_round_adjusted_gross ?? Number.MAX_SAFE_INTEGER;
        return ga - gb;
      });

      const friends: FriendYesterday[] = playedYesterday.map((f) => ({
        user_id: f.friend_user_id,
        name: f.friend_name ?? 'Player',
        thumbnail_url: f.friend_thumbnail_url ?? null,
        initial: ((f.friend_name?.charAt(0) ?? '?').toUpperCase()),
        score: f.last_round_adjusted_gross ?? 0,
        course_name: f.last_round_course_name ?? '',
      }));

      return {
        friends,
        count: friends.length,
        best: friends[0] ?? null,
      };
    },
  });
}
