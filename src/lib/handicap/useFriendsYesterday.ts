/**
 * useFriendsYesterday — surfaces WHS-connected friends who posted a round
 * with play_date == yesterday (in the user's local timezone).
 */
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays, isValid } from 'date-fns';
import { fetchFriendsActivity } from '@/lib/whs/api';

export interface FriendYesterday {
  user_id: string | null;
  name: string;
  thumbnail_url: string | null;
  initial: string;
  score: number;
  course_name: string;
  // ── New fields (already returned by fetchFriendsActivity) ──
  course_thumbnail_image: string | null;
  stableford: number | null;
  differential: number | null;
  is_counter: boolean;
  handicap_index_at_time: number | null;
  friend_handicap_index: number | null;
  played_at: string | null;
  // ── New fields, not yet wired (future backend phase) ──
  eagle_plus: number | null;
  birdie: number | null;
  par_count: number | null;
  bogey: number | null;
  double_plus: number | null;
  hole_in_one: boolean;
}

export type FriendsYesterdayAbsenceReason =
  | 'no_whs_friends'
  | 'no_friends_played'
  | 'all_filtered_null_gross'
  | null;

export interface FriendsYesterdayResult {
  friends: FriendYesterday[];
  count: number;
  best: FriendYesterday | null;
  absenceReason: FriendsYesterdayAbsenceReason;
}

/**
 * Convert a date input to a yyyy-MM-dd local-date key.
 *
 * Handles three input shapes:
 *  - null → null
 *  - ISO datetime string → parsed as UTC, converted to local
 *  - Date-only string ("2026-05-03") → parsed as local-midnight that calendar day
 *
 * @internal — exported for testing. Not part of the hook's public surface.
 */
export function toLocalDateKey(d: Date | string | null): string | null {
  if (!d) return null;
  if (d instanceof Date) {
    if (!isValid(d)) return null;
    return format(d, 'yyyy-MM-dd');
  }
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(d);
  let parsed: Date;
  if (dateOnlyMatch) {
    const [y, m, day] = d.split('-').map(Number);
    parsed = new Date(y, m - 1, day);
  } else {
    parsed = parseISO(d);
  }
  if (!isValid(parsed)) return null;
  return format(parsed, 'yyyy-MM-dd');
}

/**
 * Yesterday's date key in the user's local timezone.
 * date-fns subDays handles DST transitions correctly.
 *
 * @internal — exported for testing.
 */
export function getYesterdayKey(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function useFriendsYesterday(ownerUserId: string) {
  return useQuery<FriendsYesterdayResult>({
    queryKey: ['friends-yesterday', ownerUserId, getYesterdayKey()],
    enabled: !!ownerUserId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const activity = await fetchFriendsActivity(ownerUserId, 50);
      const yesterday = getYesterdayKey();

      // Cause 1 — no WHS friends at all
      if (activity.length === 0) {
        return {
          friends: [],
          count: 0,
          best: null,
          absenceReason: 'no_whs_friends' as const,
        };
      }

      const playedYesterdayRaw = activity.filter((f) => {
        const playedDate = toLocalDateKey(f.last_round_played_at);
        return playedDate === yesterday;
      });

      // Cause 2 — friends exist, none played yesterday
      if (playedYesterdayRaw.length === 0) {
        return {
          friends: [],
          count: 0,
          best: null,
          absenceReason: 'no_friends_played' as const,
        };
      }

      const playedYesterday = playedYesterdayRaw.filter(
        (f) =>
          f.last_round_adjusted_gross !== null &&
          f.last_round_adjusted_gross !== undefined,
      );

      // Cause 3 — friends played but all had null gross
      if (playedYesterday.length === 0) {
        return {
          friends: [],
          count: 0,
          best: null,
          absenceReason: 'all_filtered_null_gross' as const,
        };
      }

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
        course_thumbnail_image: f.course_thumbnail_image ?? null,
        stableford: f.last_round_stableford ?? null,
        differential: f.last_round_differential ?? null,
        is_counter: f.is_counter ?? false,
        handicap_index_at_time: f.handicap_index_at_time ?? null,
        friend_handicap_index: f.friend_handicap_index ?? null,
        played_at: f.last_round_played_at ?? null,
        eagle_plus: null,
        birdie: null,
        par_count: null,
        bogey: null,
        double_plus: null,
        hole_in_one: false,
      }));

      return {
        friends,
        count: friends.length,
        best: friends[0] ?? null,
        absenceReason: null,
      };
    },
  });
}
