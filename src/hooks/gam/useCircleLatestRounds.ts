import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { deriveRoundFeats, type RoundFeat } from '@/lib/gam/roundFeats';

/**
 * useCircleLatestRounds
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

export interface CircleRoundRow {
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
  /** Course par for THIS round — the reference point for the gross. */
  course_par: number | null;
  /** How many 18-hole rounds this friend has at this course (incl. this one). */
  rounds_here: number | null;
  /** Their lowest gross at this course. */
  best_here: number | null;
  /** Their average gross at this course. */
  avg_gross_here: number | null;
  net: number | null;
  /** current handicap index minus hcp_at_time. Negative = handicap dropped (good). */
  hcp_delta: number | null;
  /** Up to two feats, rarest first. */
  feats: RoundFeat[];

  // ---- INSIGHT SET (BRIEF_FRIENDS_INSIGHT_SET, part 1) -------------------
  /** Raw stats the insight states read; nulls simply fail their state. */
  birdies: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holes_in_one: number | null;
  clean_card: boolean | null;
  longest_birdie_run: number | null;
  longest_par_or_better_run: number | null;
  sub_80: boolean | null;
  /** Hole numbers, from the hole rows only. Null = we do not know where. */
  ace_hole: number | null;
  albatross_hole: number | null;
  /** To-par on each nine, from the hole rows. Null = no hole data. */
  front_nine_to_par: number | null;
  back_nine_to_par: number | null;
  /** A current, guarded course record attained with THIS round. */
  is_course_record: boolean;
  /** Their first ever sub-80 round. */
  is_first_sub_80: boolean;
}



interface Options {
  /** Max number of friends surfaced. */
  limit?: number;
  /** When true (sheet mode), if there are few friends allow up to 3 rounds per friend. */
  allowMultiplePerFriend?: boolean;
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 60;

export function useCircleLatestRounds(
  userId: string | undefined,
  { limit = 4, allowMultiplePerFriend = false }: Options = {},
) {
  return useQuery({
    queryKey: ['circle-latest-rounds', userId, limit, allowMultiplePerFriend],
    queryFn: async (): Promise<CircleRoundRow[]> => {
      if (!userId) return [];

      // 1. THE CIRCLE = accepted friendships (bidirectional) UNION the people
      //    the member FOLLOWS. Outbound follows only: following is a choice the
      //    member made, being followed is somebody else's choice and must never
      //    put a stranger's rounds here (BRIEF_WHOS_BEEN_PLAYING 1.2).
      //
      //    NO EXTRA VISIBILITY PREDICATE (1.3). gam_round_stats RLS already
      //    grants through can_view_handicap(), which requires an accepted
      //    friendship for anyone on handicap_visibility 'friends'. A followed
      //    member who restricted themselves drops out on their own terms.
      const [friendsRes, followsRes] = await Promise.all([
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted'),
        supabase.from('user_follows').select('following_id').eq('follower_id', userId),
      ]);

      const circleSet = new Set<string>();
      for (const f of (friendsRes.data ?? []) as Array<{ user_id: string; friend_id: string }>) {
        const other = f.user_id === userId ? f.friend_id : f.user_id;
        if (other && other !== userId) circleSet.add(other);
      }
      for (const f of (followsRes.data ?? []) as Array<{ following_id: string | null }>) {
        if (f.following_id && f.following_id !== userId) circleSet.add(f.following_id);
      }
      const circleIds = Array.from(circleSet);

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
        longest_birdie_run: number | null;
        longest_par_or_better_run: number | null;
        sub_80: boolean | null;
      };

      const ROUND_COLS =
        'user_id, whs_score_id, play_date, gross_score, course_par, course_name, course_id, hcp_at_time, holes_played, birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card, longest_birdie_run, longest_par_or_better_run, sub_80';

      // 2. Circle rounds — WINDOW_DAYS lookback, ordered newest first.
      const windowStartIso = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10);
      let circleRounds: Round[] = [];
      if (circleIds.length > 0) {
        const { data: rounds } = await supabase
          .from('gam_round_stats' as never)
          .select(ROUND_COLS)
          .in('user_id', circleIds)
          .gte('play_date', windowStartIso)
          .eq('holes_played', 18)
          .order('play_date', { ascending: false });
        circleRounds = ((rounds ?? []) as unknown) as Round[];
      }

      // 3. Pick rounds per circle member. Default: newest round each.
      // Sheet-mode fallback: if fewer than `limit` members have any rounds,
      // allow up to 3 rounds per member to fill the sheet.
      const byMember = new Map<string, Round[]>();
      for (const r of circleRounds) {
        const arr = byMember.get(r.user_id) ?? [];
        arr.push(r);
        byMember.set(r.user_id, arr);
      }

      const pickedRounds: Round[] = [];
      const membersWithRounds = Array.from(byMember.keys());
      if (allowMultiplePerFriend && membersWithRounds.length > 0 && membersWithRounds.length < limit) {
        for (const fid of membersWithRounds) {
          const list = byMember.get(fid) ?? [];
          pickedRounds.push(...list.slice(0, 3));
        }
      } else {
        for (const fid of membersWithRounds) {
          const list = byMember.get(fid) ?? [];
          if (list[0]) pickedRounds.push(list[0]);
        }
      }
      pickedRounds.sort((a, b) => b.play_date.localeCompare(a.play_date));
      const circleWindow = pickedRounds.slice(0, limit);

      // 4. SUGGESTED FILL (BRIEF_WHOS_BEEN_PLAYING §3). Circle rounds always
      //    come first and are never displaced; suggested rounds only occupy the
      //    shortfall, so they fall away on their own as the circle grows.
      //    ONE ROUND PER MEMBER, feats first then most recent. Same window,
      //    same holes_played, no `.in('user_id', …)` — RLS decides visibility.
      const shortfall = limit - circleWindow.length;
      const suggestedWindow: Round[] = [];
      if (shortfall > 0) {
        const { data: pool } = await supabase
          .from('gam_round_stats' as never)
          .select(ROUND_COLS)
          .gte('play_date', windowStartIso)
          .eq('holes_played', 18)
          .order('play_date', { ascending: false })
          .limit(400);
        const excluded = new Set<string>([userId, ...circleIds]);
        const bestByMember = new Map<string, Round>();
        for (const r of ((pool ?? []) as unknown) as Round[]) {
          if (excluded.has(r.user_id)) continue;
          const cur = bestByMember.get(r.user_id);
          if (!cur) {
            bestByMember.set(r.user_id, r);
            continue;
          }
          // A stranger's round needs a reason to be interesting: prefer the
          // one carrying feats, and only then the more recent.
          const curFeats = deriveRoundFeats(cur).length;
          const nextFeats = deriveRoundFeats(r).length;
          if (nextFeats > curFeats) bestByMember.set(r.user_id, r);
        }
        const ranked = Array.from(bestByMember.values()).sort((a, b) => {
          const fa = deriveRoundFeats(a).length > 0 ? 1 : 0;
          const fb = deriveRoundFeats(b).length > 0 ? 1 : 0;
          if (fa !== fb) return fb - fa;
          return b.play_date.localeCompare(a.play_date);
        });
        suggestedWindow.push(...ranked.slice(0, shortfall));
      }

      const rowsWindow = [...circleWindow, ...suggestedWindow];
      if (rowsWindow.length === 0) return [];
      const suggestedIds = new Set(suggestedWindow.map((r) => r.whs_score_id ?? `${r.user_id}-${r.play_date}`));

      // 5. Profiles (name + avatar) — ONE read covering circle AND suggested.
      const surfacedUserIds = Array.from(new Set(rowsWindow.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', surfacedUserIds);
      const profileById = new Map<string, { display_name: string | null; profile_photo_url: string | null }>();
      for (const p of (profiles ?? []) as Array<{ id: string; display_name: string | null; profile_photo_url: string | null }>) {
        profileById.set(p.id, { display_name: p.display_name, profile_photo_url: p.profile_photo_url });
      }


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

      // 7b. PERSONAL REFERENCE (BRIEF_UNDER_PAR_RED, part 2) — each surfaced
      //     friend's history at the course they played. One extra round-trip,
      //     scoped to the (user, course) pairs actually on screen.
      const surfacedCourseIds = Array.from(
        new Set(rowsWindow.map((r) => r.course_id).filter((v): v is string => !!v)),
      );
      type Hist = { rounds: number; best: number; sum: number };
      const histKey = (u: string, c: string) => `${u}|${c}`;
      const histBy = new Map<string, Hist>();
      if (surfacedCourseIds.length > 0) {
        const { data: hist } = await supabase
          .from('gam_round_stats' as never)
          .select('user_id, course_id, gross_score')
          .in('user_id', surfacedFriendIds)
          .in('course_id', surfacedCourseIds)
          .eq('holes_played', 18);
        for (const h of ((hist ?? []) as unknown) as Array<{
          user_id: string;
          course_id: string | null;
          gross_score: number | null;
        }>) {
          if (!h.course_id || h.gross_score == null) continue;
          const k = histKey(h.user_id, h.course_id);
          const cur = histBy.get(k);
          if (!cur) histBy.set(k, { rounds: 1, best: h.gross_score, sum: h.gross_score });
          else {
            cur.rounds += 1;
            cur.sum += h.gross_score;
            if (h.gross_score < cur.best) cur.best = h.gross_score;
          }
        }
      }

      // 7c. INSIGHT SET (BRIEF_FRIENDS_INSIGHT_SET) — three cheap reads.
      //
      //  i.  HOLE ROWS. State 6 (the nine-by-nine split) and the hole numbers
      //      on the ace / albatross lines need them. MEASURED: index scan on
      //      whs_score_holes_score_idx, ~18 rows per score, 3.3ms total for ten
      //      scores. Affordable, so state 6 is IN and no line guesses where a
      //      feat fell.
      const nineByScore = new Map<string, { front: number; back: number }>();
      const aceHoleByScore = new Map<string, number>();
      const albatrossHoleByScore = new Map<string, number>();
      if (scoreIds.length > 0) {
        const { data: holes } = await supabase
          .from('whs_score_holes' as never)
          .select('score_id, hole_no, par, actual_gross')
          .in('score_id', scoreIds);
        type Hole = {
          score_id: string;
          hole_no: number | null;
          par: number | null;
          actual_gross: number | null;
        };
        const acc = new Map<string, { fp: number; fg: number; bp: number; bg: number; fn: number; bn: number }>();
        for (const h of ((holes ?? []) as unknown) as Hole[]) {
          if (h.hole_no == null || h.par == null || h.actual_gross == null) continue;
          if (h.actual_gross === 1) aceHoleByScore.set(h.score_id, h.hole_no);
          else if (h.par - h.actual_gross === 3) albatrossHoleByScore.set(h.score_id, h.hole_no);
          const a = acc.get(h.score_id) ?? { fp: 0, fg: 0, bp: 0, bg: 0, fn: 0, bn: 0 };
          if (h.hole_no <= 9) {
            a.fp += h.par;
            a.fg += h.actual_gross;
            a.fn += 1;
          } else {
            a.bp += h.par;
            a.bg += h.actual_gross;
            a.bn += 1;
          }
          acc.set(h.score_id, a);
        }
        acc.forEach((a, sid) => {
          // Both nines must be complete, or the split says nothing true.
          if (a.fn !== 9 || a.bn !== 9) return;
          nineByScore.set(sid, { front: a.fg - a.fp, back: a.bg - a.bp });
        });
      }

      //  ii. COURSE RECORDS. A record only counts where the legends board has
      //      three distinct players at the course — the same guard
      //      create_round_posts applies (see useCourseFieldSizes.ts, which
      //      counts distinct members on the same view).
      const RECORD_MIN_PLAYERS = 3;
      const recordScoreIds = new Set<string>();
      if (surfacedCourseIds.length > 0) {
        const { data: legends } = await supabase
          .from('gam_course_legends_view')
          .select('course_id, user_id, rank, category, trigger_whs_score_id')
          .in('course_id', surfacedCourseIds)
          .eq('is_current', true);
        const playersByCourse = new Map<string, Set<string>>();
        const candidates: Array<{ course_id: string; score_id: string }> = [];
        for (const l of ((legends ?? []) as unknown) as Array<{
          course_id: string | null;
          user_id: string | null;
          rank: number | null;
          category: string | null;
          trigger_whs_score_id: string | null;
        }>) {
          if (!l.course_id || !l.user_id) continue;
          const set = playersByCourse.get(l.course_id) ?? new Set<string>();
          set.add(l.user_id);
          playersByCourse.set(l.course_id, set);
          if (
            l.category === 'lowest_gross_all_time' &&
            Number(l.rank) === 1 &&
            l.trigger_whs_score_id &&
            scoreIds.includes(l.trigger_whs_score_id)
          ) {
            candidates.push({ course_id: l.course_id, score_id: l.trigger_whs_score_id });
          }
        }
        for (const c of candidates) {
          if ((playersByCourse.get(c.course_id)?.size ?? 0) >= RECORD_MIN_PLAYERS) {
            recordScoreIds.add(c.score_id);
          }
        }
      }

      //  iii. FIRST SUB-80. Earliest sub-80 play_date per surfaced friend.
      const firstSub80ByUser = new Map<string, string>();
      if (surfacedFriendIds.length > 0) {
        const { data: sub80 } = await supabase
          .from('gam_round_stats' as never)
          .select('user_id, play_date')
          .in('user_id', surfacedFriendIds)
          .eq('holes_played', 18)
          .eq('sub_80', true);
        for (const s of ((sub80 ?? []) as unknown) as Array<{ user_id: string; play_date: string }>) {
          const cur = firstSub80ByUser.get(s.user_id);
          if (!cur || s.play_date < cur) firstSub80ByUser.set(s.user_id, s.play_date);
        }
      }


      // 8. Assemble rows.
      const out: CircleRoundRow[] = rowsWindow.map((r): CircleRoundRow => {
        const profile = profileById.get(r.user_id);
        const score = r.whs_score_id ? scoreById.get(r.whs_score_id) : undefined;
        const net =
          score && score.adjusted_gross != null && score.course_handicap != null
            ? score.adjusted_gross - score.course_handicap
            : null;
        const current = currentHcpByUser.get(r.user_id) ?? null;
        const hist = r.course_id ? histBy.get(histKey(r.user_id, r.course_id)) : undefined;
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
          course_par: r.course_par ?? null,
          rounds_here: hist?.rounds ?? null,
          best_here: hist?.best ?? null,
          avg_gross_here: hist ? Math.round((hist.sum / hist.rounds) * 10) / 10 : null,

          net,
          hcp_delta: hcpDelta,
          feats: featsForRound(r),

          birdies: r.birdies,
          eagles: r.eagles,
          albatrosses: r.albatrosses,
          holes_in_one: r.holes_in_one,
          clean_card: r.clean_card,
          longest_birdie_run: r.longest_birdie_run,
          longest_par_or_better_run: r.longest_par_or_better_run,
          sub_80: r.sub_80,
          ace_hole: r.whs_score_id ? aceHoleByScore.get(r.whs_score_id) ?? null : null,
          albatross_hole: r.whs_score_id ? albatrossHoleByScore.get(r.whs_score_id) ?? null : null,
          front_nine_to_par: r.whs_score_id ? nineByScore.get(r.whs_score_id)?.front ?? null : null,
          back_nine_to_par: r.whs_score_id ? nineByScore.get(r.whs_score_id)?.back ?? null : null,
          is_course_record: !!r.whs_score_id && recordScoreIds.has(r.whs_score_id),
          is_first_sub_80:
            r.sub_80 === true && firstSub80ByUser.get(r.user_id) === r.play_date,
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
