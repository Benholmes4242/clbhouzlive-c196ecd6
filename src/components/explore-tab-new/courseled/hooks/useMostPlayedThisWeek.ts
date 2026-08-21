import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useMostPlayedThisWeek — tracked WHS rounds per course over a rolling 7 days,
 * with the delta against the prior 7 (BRIEF, section 5).
 *
 * QUERY SHAPE: one client select over gam_round_stats for the 14-day window
 * (course_id + play_date only), counted client-side for both windows. Platform
 * volume is single figures per week, so an RPC would buy nothing; if row volume
 * ever makes this heavy the aggregate belongs in a `discover_most_played` RPC
 * returning (course_id, rounds_7d, rounds_prev_7d).
 *
 * A cooling-off course shows NO delta — never a red one.
 *
 * TWO SUPPRESSIONS, both here so the component never receives a figure it
 * should not draw:
 *  - NO PRIOR WEEK: prev = 0 means the course is APPEARING, not growing. The
 *    delta would equal the count and print the same number twice, so it is
 *    null.
 *  - FLOOR: courses under MIN_ROUNDS are dropped entirely. With none qualifying
 *    the list is empty and the section renders nothing.
 */

/**
 * A course needs at least this many rounds in the 7-day window to appear.
 *
 * ONE, NOT TWO (BRIEF_MOST_PLAYED_MIN_ONE §1.1): at this member base a single
 * tracked round is still a course somebody played, and a floor of two was
 * hiding three of the five courses played in the week. Five honest entries beat
 * two "qualifying" ones.
 */
const MIN_ROUNDS = 1;

/** Every outcome of the week-on-week comparison, none discarded. */
export type MostPlayedMove = 'new' | 'up' | 'down' | 'level';

export interface MostPlayedRow {
  courseId: string;
  courseName: string | null;
  count: number;
  /** Rounds in the prior 7 days. */
  prior: number;
  /** Raw signed change vs the prior 7 days (count - prior). */
  change: number;
  /** Which of the four states the row renders. */
  move: MostPlayedMove;
  /**
   * DISTINCT members with a tracked round here in the CURRENT seven days.
   * The count on the right is ROUNDS, so this is the figure that says
   * "4 rounds, by 3 members".
   *
   * AMENDED (BRIEF_MOST_PLAYED_WHO_PLAYED §S0.2): the Set behind this count is
   * still built the same way from the same 14-day read — but it is no longer
   * thrown away. `players` below resolves those very ids through ONE profile
   * select, so the row can say WHO played rather than only how many. The last
   * clause of this comment ("No avatars, no profile join — a count") is the
   * only part that is now wrong.
   */
  members: number;
  /**
   * Average to par over the CURRENT seven days, eighteen-hole scored rounds
   * only. Null when the course has no comparable scored round this week.
   */
  avgToPar: number | null;
  /**
   * THE MEMBERS BEHIND THE COUNT, lowest gross first (§S1.4). One entry per
   * DISTINCT member — a member who played twice appears once, carrying their
   * BEST gross (§S4.2). A member whose profile cannot be resolved (deleted
   * account, RLS) is dropped rather than drawn as a blank circle (§S4.4), so
   * `players.length` can be lower than `members`.
   */
  players: MostPlayedPlayer[];
  /**
   * LOWEST GROSS at this course in the current seven days, over every tracked
   * round — independent of whether that member's profile resolved. Null when no
   * round this week carried a gross.
   */
  bestGross: number | null;
}

/** One resolved member on a most-played row. */
export interface MostPlayedPlayer {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** That member's BEST (lowest) gross at this course this week. */
  gross: number | null;
  /**
   * TO PAR for that same best round (gross - course_par), null when the round
   * carried no par. BRIEF_MOST_PLAYED_LEADERBOARD §S2.5 — the board shows BOTH
   * the to-par and the gross, so the to-par has to travel with the gross it
   * belongs to rather than being recomputed against a different round.
   */
  toPar: number | null;
  /**
   * THE MEMBER'S HOME CLUB (§S2.4). A tournament board has always carried a
   * player's club, so it reads as native — and it answers "who is this person?"
   * for the members the Worldwide and Suggested scopes surface, who the viewer
   * does not know.
   *
   * SOURCE: user_home_clubs -> golf_clubs.name, preferring the row that matches
   * user_profiles.primary_club_id; user_profiles.home_club (free text) backfills
   * a member who typed a club that is not in golf_clubs.
   *
   * PRIVACY: withheld unless home_club_visibility is 'public'. The brief said
   * only "join it"; 'followers' and 'friends' are real settings on this column
   * and a Discover board is neither. See the report.
   *
   * `null` when there is none — the row renders NO second line, no placeholder,
   * and does not change height (§S2.4).
   */
  homeClub: string | null;
  /**
   * THE WHS SCORE ID OF THAT BEST ROUND. It is what opens the scorecard bottom
   * sheet when the row is tapped; `null` (an untracked or unresolved round)
   * falls back to the member's profile.
   */
  scoreId: string | null;
  /**
   * BOARD POSITION, 1-based, TIES SHARING (§S2.7): two 76s are both 2nd and the
   * next is 4th. Computed here beside the sort so the board never invents an
   * order between equal scores.
   */
  position: number;
}


const DAY = 86_400_000;

export function useMostPlayedThisWeek(limit = 25) {
  return useQuery({
    queryKey: ['courseled', 'most-played', limit],
    queryFn: async (): Promise<MostPlayedRow[]> => {
      const now = Date.now();
      const startPrev = new Date(now - 14 * DAY).toISOString().slice(0, 10);
      const startCur = new Date(now - 7 * DAY).toISOString().slice(0, 10);

      // SAME READ, TWO MORE COLUMNS. gam_round_stats carries NO to-par field,
      // so the average is derived from gross_score - course_par; holes_played
      // keeps nine-hole cards out of that average only.
      const { data, error } = await supabase
        .from('gam_round_stats' as never)
        .select('whs_score_id, course_id, course_name, play_date, gross_score, course_par, holes_played, user_id')
        .gte('play_date', startPrev)
        .not('course_id', 'is', null);
      if (error) throw error;

      const rows = ((data ?? []) as unknown) as Array<{
        whs_score_id: string | null;
        course_id: string | null;
        course_name: string | null;
        play_date: string;
        user_id: string | null;
        gross_score: number | null;
        course_par: number | null;
        holes_played: number | null;
      }>;

      const cur = new Map<string, number>();
      const prev = new Map<string, number>();
      const names = new Map<string, string | null>();
      /** Running to-par sum/count for the CURRENT week, 18-hole scored only. */
      const par = new Map<string, { sum: number; n: number }>();
      /** DISTINCT members per course, CURRENT week only. */
      const members = new Map<string, Set<string>>();
      /** BEST (lowest) gross per `${courseId}|${userId}`, CURRENT week only,
       *  carrying the par of THAT round so the to-par matches the gross. */
      const bestByMember = new Map<
        string,
        { gross: number; par: number | null; scoreId: string | null }
      >();
      /** BEST (lowest) gross per course, CURRENT week only. */
      const bestByCourse = new Map<string, number>();

      for (const r of rows) {
        if (!r.course_id) continue;
        names.set(r.course_id, r.course_name ?? names.get(r.course_id) ?? null);
        const isCurrent = r.play_date >= startCur;
        const bucket = isCurrent ? cur : prev;
        bucket.set(r.course_id, (bucket.get(r.course_id) ?? 0) + 1);
        if (isCurrent && r.user_id) {
          const set = members.get(r.course_id) ?? new Set<string>();
          set.add(r.user_id);
          members.set(r.course_id, set);
          // BEST, NOT LATEST (§S4.2): the Set already deduplicates the member,
          // so the gross is folded into a per-(course, member) minimum. Two
          // rounds in the week collapse to the better one — the join below
          // cannot re-multiply what is already keyed by member id.
          if (r.gross_score != null) {
            const key = `${r.course_id}|${r.user_id}`;
            const held = bestByMember.get(key);
            if (held == null || r.gross_score < held.gross)
              bestByMember.set(key, {
                gross: r.gross_score,
                par: r.course_par ?? null,
                /* THE SCORE ID TRAVELS WITH THE GROSS IT BELONGS TO, so tapping
                   a board row opens THAT round's scorecard and not the
                   member's most recent one. */
                scoreId: r.whs_score_id ?? null,
              });
            const courseBest = bestByCourse.get(r.course_id);
            if (courseBest == null || r.gross_score < courseBest)
              bestByCourse.set(r.course_id, r.gross_score);
          }
        }
        if (
          isCurrent &&
          r.holes_played === 18 &&
          r.gross_score != null &&
          r.course_par != null
        ) {
          const agg = par.get(r.course_id) ?? { sum: 0, n: 0 };
          agg.sum += r.gross_score - r.course_par;
          agg.n += 1;
          par.set(r.course_id, agg);
        }
      }

      const base = [...cur.entries()]
        .filter(([, count]) => count >= MIN_ROUNDS)
        .map(([courseId, count]) => {
          const before = prev.get(courseId) ?? 0;
          const change = count - before;
          const agg = par.get(courseId);
          return {
            courseId,
            courseName: names.get(courseId) ?? null,
            count,
            prior: before,
            change,
            // FOUR STATES, NONE DISCARDED: a drop and a first appearance are
            // both reportable facts about the week.
            move: (before === 0
              ? 'new'
              : change > 0
                ? 'up'
                : change < 0
                  ? 'down'
                  : 'level') as MostPlayedMove,
            avgToPar: agg && agg.n > 0 ? agg.sum / agg.n : null,
            members: members.get(courseId)?.size ?? 0,
            bestGross: bestByCourse.get(courseId) ?? null,
            players: [] as MostPlayedPlayer[],
          };
        })
        .sort((a, b) => b.count - a.count || (a.courseName ?? '').localeCompare(b.courseName ?? ''))
        .slice(0, limit);

      /**
       * THE PROFILE JOIN (§S0.1/§S0.3). ONE select over user_profiles keyed by
       * the ids the Sets above already hold — NOT a second read of
       * gam_round_stats, and nothing about how the leaderboard is computed,
       * ordered or capped moved. Only the rows that survive the slice are
       * resolved. public_profiles backfills anything RLS withheld (the same
       * pattern useLatestReviews uses for signed-out readers).
       */
      const wanted = Array.from(
        new Set(base.flatMap((r) => [...(members.get(r.courseId) ?? [])])),
      );
      const byId = new Map<
        string,
        {
          name: string;
          avatarUrl: string | null;
          homeClub: string | null;
          primaryClubId: string | null;
          /** TRUE when the member's home_club_visibility is not 'public'. */
          clubHidden: boolean;
        }
      >();
      if (wanted.length > 0) {
        const { data: profs } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url, home_club, home_club_visibility, primary_club_id')
          .in('id', wanted);
        for (const p of (profs ?? []) as any[]) {
          const name = String(p.display_name ?? p.username ?? '').trim();
          if (!name) continue;
          // PUBLIC ONLY. 'followers' / 'friends' are live values on this column
          // and Discover is neither relationship.
          const visible = (p.home_club_visibility ?? 'public') === 'public';
          const typed = String(p.home_club ?? '').trim();
          byId.set(p.id as string, {
            name,
            avatarUrl: p.profile_photo_url ?? null,
            homeClub: visible && typed ? typed : null,
            primaryClubId: (p.primary_club_id as string | null) ?? null,
            clubHidden: !visible,
          });
        }
        const missing = wanted.filter((id) => !byId.has(id));
        if (missing.length > 0) {
          const { data: pub } = await supabase
            .from('public_profiles')
            .select('id, username, display_name, profile_photo_url, home_club, primary_club_id')
            .in('id', missing);
          for (const p of (pub ?? []) as any[]) {
            const name = String(p.display_name ?? p.username ?? '').trim();
            // public_profiles ALREADY APPLIES VISIBILITY — anything it hands
            // back is public by construction, so no second gate here.
            if (name)
              byId.set(p.id as string, {
                name,
                avatarUrl: p.profile_photo_url ?? null,
                homeClub: String(p.home_club ?? '').trim() || null,
                primaryClubId: (p.primary_club_id as string | null) ?? null,
                clubHidden: false,
              });
          }
        }

        /**
         * THE HOME-CLUB JOIN (§S2.4). ONE select over user_home_clubs with its
         * golf_clubs name, for the same ids. It OVERRIDES the free-text
         * user_profiles.home_club when it resolves, because a real club record
         * is the better name; the free text stays as the backfill for a member
         * whose club is not in golf_clubs. A member with neither keeps null and
         * the board draws no second line.
         */
        const resolvable = wanted.filter((id) => byId.get(id)?.clubHidden === false);
        if (resolvable.length > 0) {
          const { data: links } = await supabase
            .from('user_home_clubs')
            .select('user_profile_id, club_id, golf_clubs:club_id(name)')
            .in('user_profile_id', resolvable);
          const picked = new Map<string, string>();
          type Link = {
            user_profile_id: string;
            club_id: string | null;
            golf_clubs: { name: string | null } | { name: string | null }[] | null;
          };
          for (const l of ((links ?? []) as unknown as Link[])) {
            const uid = l.user_profile_id;
            // PostgREST returns an OBJECT for a to-one embed and an ARRAY when it
            // cannot prove the relationship is to-one. Handle both or the club
            // silently never renders.
            const club = Array.isArray(l.golf_clubs) ? l.golf_clubs[0] : l.golf_clubs;
            const clubName = String(club?.name ?? '').trim();
            if (!clubName) continue;
            const entry = byId.get(uid);
            if (!entry) continue;
            if (entry.primaryClubId == null) {
              // NO PRIMARY DECLARED: the first resolvable club speaks for them.
              if (!picked.has(uid)) picked.set(uid, clubName);
            } else if (entry.primaryClubId === l.club_id) {
              // A PRIMARY EXISTS: only that club may speak for the member.
              picked.set(uid, clubName);
            }
          }
          for (const [uid, clubName] of picked) {
            const entry = byId.get(uid);
            if (entry) entry.homeClub = clubName;
          }
        }
      }

      for (const row of base) {
        const sorted = [...(members.get(row.courseId) ?? [])]
          // A ROUND WITH NO RESOLVABLE MEMBER DRAWS NOTHING (§S4.4).
          .filter((userId) => byId.has(userId))
          .map((userId) => {
            const prof = byId.get(userId)!;
            const best = bestByMember.get(`${row.courseId}|${userId}`) ?? null;
            return {
              userId,
              name: prof.name,
              avatarUrl: prof.avatarUrl,
              homeClub: prof.homeClub,
              gross: best?.gross ?? null,
              toPar: best && best.par != null ? best.gross - best.par : null,
              scoreId: best?.scoreId ?? null,
              position: 0,
            };
          })
          // ORDER BY GROSS, LOWEST FIRST (§S2.6); a member with no gross sorts
          // last. Ties keep a STABLE alphabetical order so the board does not
          // reshuffle between renders — but they SHARE a position below, which
          // is not the same thing as inventing an order between them.
          .sort(
            (a, b) =>
              (a.gross ?? Number.POSITIVE_INFINITY) - (b.gross ?? Number.POSITIVE_INFINITY) ||
              a.name.localeCompare(b.name),
          );

        // TIES SHARE A POSITION AND THE NEXT POSITION SKIPS (§S2.7): two 76s
        // are both 2nd and the next is 4th, as a real board does it.
        let lastGross: number | null | undefined;
        let lastPos = 0;
        sorted.forEach((p, idx) => {
          if (idx > 0 && p.gross != null && p.gross === lastGross) {
            p.position = lastPos;
          } else {
            p.position = idx + 1;
            lastPos = p.position;
          }
          lastGross = p.gross;
        });

        row.players = sorted;
      }

      return base satisfies MostPlayedRow[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

}
