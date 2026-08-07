import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { deriveRoundFeats, type RoundFeat } from '@/lib/gam/roundFeats';

/**
 * useFriendsLatestRounds
 * ----------------------
 * Powers the "Friends' latest rounds" section on Discover AND its View-all sheet.
 * A single hook, one round-trip per data source, grouped client-side. Read
 * usePulseFriends.ts for the friend-resolution reference — this hook does
 * not modify or share cache with it.
 *
 * NET DECISION (brief 1.2)
 *   Option (a): join gam_round_stats.whs_score_id -> whs_scores for
 *   adjusted_gross and course_handicap; net = adjusted_gross - course_handicap.
 *   Rows without a matching whs_scores row simply omit net (undefined). We do
 *   NOT approximate net from hcp_at_time (that is the handicap INDEX, not the
 *   course-specific playing handicap).
 *
 * FEAT CHIPS
 *   Derived from gam_round_stats columns (deterministic, always present) —
 *   NOT from gam_user_badges. Badges are a milestone mechanism and are sparse
 *   by design, so a notable round (e.g. four birdies) often has no badge.
 *   The badge path (trigger_whs_score_id) remains the right foundation for a
 *   future "recent unlocks" surface (streaks, Founder, Course Legend), which
 *   deliberately do NOT belong on round rows. Follow-up, not built here.
 */

// Feat derivation lives in src/lib/gam/roundFeats.ts and is shared with
// "The record book" chips. Re-exported here for existing consumers.
export type { RoundFeatKey, RoundFeat } from '@/lib/gam/roundFeats';
export { BIRDIE_HAUL_THRESHOLD } from '@/lib/gam/roundFeats';

export interface FriendRoundRow {
  round_id: string;
  score_id: string | null;
  connection_id: string | null;
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  play_date: string; // ISO date (YYYY-MM-DD)
  course_name: string | null;
  /** Catalogue course id when the round is matched — drives course-led routing. */
  course_id: string | null;

  gross: number | null;
  net: number | null;
  /** current handicap index minus hcp_at_time. Negative = handicap dropped (good). */
  hcp_delta: number | null;
  /** Up to two feats, rarest first. */
  feats: RoundFeat[];
}


interface Options {
  /** Max number of friends surfaced. */
  limit?: number;
  /** When true (sheet mode), if there are few friends allow up to 3 rounds per friend. */
  allowMultiplePerFriend?: boolean;
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 60;

export function useFriendsLatestRounds(
  userId: string | undefined,
  { limit = 4, allowMultiplePerFriend = false }: Options = {},
) {
  return useQuery({
    queryKey: ['friends-latest-rounds', userId, limit, allowMultiplePerFriend],
    queryFn: async (): Promise<FriendRoundRow[]> => {
      if (!userId) return [];

      // 1. Accepted friendships (bidirectional)
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      const friendIds = Array.from(
        new Set(
          (friendships ?? []).map((f: { user_id: string; friend_id: string }) =>
            f.user_id === userId ? f.friend_id : f.user_id,
          ),
        ),
      ).filter(Boolean) as string[];
      if (friendIds.length === 0) return [];

      // 2. Profiles (name + avatar)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', friendIds);
      const profileById = new Map<string, { display_name: string | null; profile_photo_url: string | null }>();
      for (const p of (profiles ?? []) as Array<{ id: string; display_name: string | null; profile_photo_url: string | null }>) {
        profileById.set(p.id, { display_name: p.display_name, profile_photo_url: p.profile_photo_url });
      }

      // 3. Rounds — WINDOW_DAYS lookback, ordered newest first.
      const windowStartIso = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
      const { data: rounds } = await supabase
        .from('gam_round_stats' as never)
        .select(
          'user_id, whs_score_id, play_date, gross_score, course_par, course_name, course_id, hcp_at_time, holes_played, birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card',
        )
        .in('user_id', friendIds)
        .gte('play_date', windowStartIso)
        .eq('holes_played', 18)
        .order('play_date', { ascending: false });

      type Round = {
        user_id: string;
        whs_score_id: string | null;
        play_date: string;
        gross_score: number | null;
        course_par: number | null;
        course_name: string | null;
        course_id: string | null;
        hcp_at_time: number | null;
        birdies: number | null;
        eagles: number | null;
        albatrosses: number | null;
        holes_in_one: number | null;
        beat_par: boolean | null;
        clean_card: boolean | null;
      };

      const allRounds = ((rounds ?? []) as unknown) as Round[];
      if (allRounds.length === 0) return [];

      // 4. Pick rounds per friend. Default: newest round per friend.
      // Sheet-mode fallback: if fewer than `limit` friends have any rounds,
      // allow up to 3 rounds per friend to fill the sheet.
      const byFriend = new Map<string, Round[]>();
      for (const r of allRounds) {
        const arr = byFriend.get(r.user_id) ?? [];
        arr.push(r);
        byFriend.set(r.user_id, arr);
      }

      const pickedRounds: Round[] = [];
      const friendsWithRounds = Array.from(byFriend.keys());
      if (allowMultiplePerFriend && friendsWithRounds.length > 0 && friendsWithRounds.length < limit) {
        for (const fid of friendsWithRounds) {
          const list = byFriend.get(fid) ?? [];
          pickedRounds.push(...list.slice(0, 3));
        }
      } else {
        for (const fid of friendsWithRounds) {
          const list = byFriend.get(fid) ?? [];
          if (list[0]) pickedRounds.push(list[0]);
        }
      }
      pickedRounds.sort((a, b) => b.play_date.localeCompare(a.play_date));
      const rowsWindow = pickedRounds.slice(0, limit);
      if (rowsWindow.length === 0) return [];

      // 5. whs_scores lookup for net (option 1.2a) + connection_id for opener.
      const scoreIds = rowsWindow.map((r) => r.whs_score_id).filter((v): v is string => !!v);
      const scoreById = new Map<
        string,
        { adjusted_gross: number | null; course_handicap: number | null; connection_id: string | null }
      >();
      if (scoreIds.length > 0) {
        const { data: scores } = await supabase
          .from('whs_scores' as never)
          .select('id, adjusted_gross, course_handicap, connection_id')
          .in('id', scoreIds);
        for (const s of ((scores ?? []) as unknown) as Array<{
          id: string;
          adjusted_gross: number | null;
          course_handicap: number | null;
          connection_id: string | null;
        }>) {
          scoreById.set(s.id, {
            adjusted_gross: s.adjusted_gross,
            course_handicap: s.course_handicap,
            connection_id: s.connection_id,
          });
        }
      }

      // 6. Current handicap index per friend (latest snapshot per connection).
      const surfacedFriendIds = Array.from(new Set(rowsWindow.map((r) => r.user_id)));
      const currentHcpByUser = new Map<string, number>();
      if (surfacedFriendIds.length > 0) {
        const { data: connections } = await supabase
          .from('whs_connections')
          .select('id, user_id')
          .in('user_id', surfacedFriendIds)
          .is('deleted_at', null);
        const connToUser = new Map<string, string>();
        const connectionIds: string[] = [];
        for (const c of ((connections ?? []) as unknown) as Array<{ id: string; user_id: string }>) {
          connToUser.set(c.id, c.user_id);
          connectionIds.push(c.id);
        }
        if (connectionIds.length > 0) {
          const { data: snaps } = await supabase
            .from('whs_handicap_snapshots' as never)
            .select('connection_id, handicap_index, observed_at')
            .in('connection_id', connectionIds)
            .order('observed_at', { ascending: false });
          for (const s of ((snaps ?? []) as unknown) as Array<{
            connection_id: string;
            handicap_index: number | string | null;
            observed_at: string;
          }>) {
            const uid = connToUser.get(s.connection_id);
            if (!uid || currentHcpByUser.has(uid)) continue;
            if (s.handicap_index != null) currentHcpByUser.set(uid, Number(s.handicap_index));
          }
        }
      }

      // 7. Feats — derived from the round stats already selected above.
      //    Priority order is rarest first; capped at two per row.
      const featsForRound = (r: Round): RoundFeat[] => deriveRoundFeats(r);

      // 8. Assemble rows.
      const out: FriendRoundRow[] = rowsWindow.map((r): FriendRoundRow => {
        const profile = profileById.get(r.user_id);
        const score = r.whs_score_id ? scoreById.get(r.whs_score_id) : undefined;
        const net =
          score && score.adjusted_gross != null && score.course_handicap != null
            ? score.adjusted_gross - score.course_handicap
            : null;
        const current = currentHcpByUser.get(r.user_id) ?? null;
        const hcpDelta =
          current != null && r.hcp_at_time != null
            ? Math.round((current - Number(r.hcp_at_time)) * 10) / 10
            : null;
        return {
          round_id: r.whs_score_id ?? `${r.user_id}-${r.play_date}`,
          score_id: r.whs_score_id,
          connection_id: score?.connection_id ?? null,
          user_id: r.user_id,
          display_name: profile?.display_name ?? 'Player',
          profile_photo_url: profile?.profile_photo_url ?? null,
          play_date: r.play_date,
          course_name: r.course_name,
          course_id: r.course_id ?? null,
          gross: r.gross_score,

          net,
          hcp_delta: hcpDelta,
          feats: featsForRound(r),
        };
      });

      return out;
    },
    enabled: !!userId,
    // The source is the England Golf sync, which lands roughly DAILY. A
    // one-minute threshold checked ~1,400 times for something that arrives
    // once, on a mobile WebView. No polling here, then or now.
    staleTime: 30 * 60 * 1000,

  });
}
