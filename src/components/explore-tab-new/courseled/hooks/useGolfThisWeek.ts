import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useUserJourneyCourses } from '@/hooks/useUserJourneyCourses';
import { usePlayedUnratedCourses } from '@/hooks/usePlayedUnratedCourses';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

/**
 * GOLF THIS WEEK — the data layer (BRIEF_GOLF_THIS_WEEK §1, extended by
 * BRIEF_MERGE_CIRCLE_AND_GOLF_THIS_WEEK §S2).
 *
 * ONE READ, NO FEAT THRESHOLD, FOURTEEN DAYS FOR EVERY SCOPE (see GOLF_WEEK_DAYS below). Your Circle and Golf
 * this week were one section shown twice; they are now one rail whose SCOPE is a
 * pill. The scope is answered by the DATABASE — Top 100 and Played are course
 * allow-lists passed into the query, never a client-side discard of rows the app
 * already paid to enrich.
 *
 * The read is `useCircleLatestRounds`, so the whole existing enrichment pipeline
 * — nines, course records, per-course history, feats, index movement — is shared
 * rather than duplicated. RLS decides visibility.
 */

/**
 * FOURTEEN DAYS (BRIEF_DISCOVER_FOURTEEN_DAY_WINDOW §1). The window was seven;
 * Ben widened it to a fortnight and every "this week" claim in the copy now
 * reads "in the last 14 days". A FIXED constant — never derived from the data.
 *
 * KNOWN, ACCEPTED COST (§5): the identifiers still say WEEK — useGolfThisWeek,
 * GOLF_WEEK_*, WeekScope, the discover.golfThisWeek.* / discover.week.* keys.
 * Renaming them would touch dozens of files and every locale key for no
 * user-visible gain, so the names name a week while the window is a fortnight.
 */
export const GOLF_WEEK_DAYS = 14;

/**
 * THE ONLY BOUND (BRIEF_GOLF_THIS_WEEK_UNCAP §1/§3). The rail renders EVERY
 * round the fetch returns for the selected scope — there is no client-side rail
 * cap. So "unlimited" means UP TO 120: the fetch is the single bound, and the
 * readout is true only while a scope's real fourteen-day total stays under it.
 * DOUBLED WITH THE WINDOW (§1): a fortnight is expected to carry twice the rows,
 * and if the cap clipped them the readout and the rail would disagree on a busy
 * fortnight. Current volume is single figures per week, so this is headroom.
 */
export const GOLF_WEEK_FETCH = 120;


/**
 * The scopes (§S2.1, extended by BRIEF_GOLF_THIS_WEEK_P4 §S4.1, narrowed by
 * MICRO_BRIEF_REMOVE_SUGGESTED_SCOPE). Worldwide leads and is the default.
 * BEN'S ORDER: the three RELEVANCE scopes lead (worldwide, circle,
 * handicap_band) and the two CATALOGUE scopes follow (played, top_100) — which
 * is why 'played' now sits above 'top_100'. 'suggested' is removed: an unknown
 * inbound value falls back to DEFAULT_WEEK_SCOPE, it never errors.
 */
export type WeekScope =
  | 'worldwide'
  | 'circle'
  | 'home_club'
  | 'handicap_band'
  | 'played'
  | 'top_100';
export const WEEK_SCOPES: WeekScope[] = [
  'worldwide',
  'circle',
  /* HOME CLUB sits with the relational scopes, directly after `circle` — your
     club is the tightest circle a member has (BRIEF_HOME_CLUB_LENS §S3). It is
     CONDITIONAL: see HOME_CLUB_MIN_MEMBERS and useAvailableWeekScopes. */
  'home_club',
  'handicap_band',
  'played',
  'top_100',
];
export const DEFAULT_WEEK_SCOPE: WeekScope = 'worldwide';

/**
 * Within 4.0 strokes either side, inclusive. MICRO_BRIEF_HANDICAP_BAND_WIDTH:
 * widened from the original 2.0 (BRIEF_GOLF_THIS_WEEK_P4 §S2.1) because that
 * band was too thin at the current membership size (~11 qualifying rounds
 * against 35 worldwide); 4.0 roughly doubles the field and a 1.8 index
 * against a 5.8 is still a fair comparison. Fixed for everyone — the band
 * NEVER widens automatically when results are thin.
 */
export const HANDICAP_BAND_STROKES = 4.0;

/**
 * THE VIEWER'S INDEX (§S1.1): eg_handicap_index first, manual_handicap_index as
 * the fallback when there is no sync. NEITHER PRESENT = null, and a null index
 * means the scope does not exist for this member at all (§S1.2).
 */
export function useViewerHandicapIndex(userId: string | undefined) {
  const query = useQuery<number | null>({
    queryKey: ['courseled', 'viewer-handicap-index', userId ?? null],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('eg_handicap_index, manual_handicap_index')
        .eq('id', userId as string)
        .maybeSingle();
      if (error || !data) return null;
      const eg = data.eg_handicap_index;
      const manual = data.manual_handicap_index;
      if (eg != null) return Number(eg);
      if (manual != null) return Number(manual);
      return null;
    },
  });
  return { index: query.data ?? null, ready: !userId || !query.isPending };
}

/**
 * TWO DISTINCT MEMBERS, MINIMUM (BRIEF_HOME_CLUB_LENS §S1). A field of one is a
 * mirror, not a leaderboard, and a club running two rounds a fortnight would
 * blink the pill on and off between visits. The floor removes both cases at once
 * and is NEVER lowered to make the pill appear more widely.
 */
export const HOME_CLUB_MIN_MEMBERS = 2;

/** The viewer's canonical home club. `home_club` (free text) is never consulted. */
export function useViewerHomeClubId(userId: string | undefined) {
  const query = useQuery<string | null>({
    queryKey: ['courseled', 'viewer-home-club', userId ?? null],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('primary_club_id')
        .eq('id', userId as string)
        .maybeSingle();
      if (error || !data) return null;
      return data.primary_club_id ?? null;
    },
  });
  return { clubId: query.data ?? null, ready: !userId || !query.isPending };
}

/**
 * THE CLUB FILTER. A PLAYER filter over the same fetched pool the other scopes
 * filter — no second query for the rounds themselves (§S3). Includes the
 * member's own rounds, as every scope does.
 */
export function filterToHomeClub(
  rows: readonly CircleRoundRow[],
  clubId: string | null,
): CircleRoundRow[] {
  if (!clubId) return [];
  return rows.filter((r) => r.player_club_id === clubId);
}

/**
 * THE PILL LIST IS DERIVED, NEVER HARD-CODED (§S1.2). A member with no index
 * gets a five-pill row with no gap where the sixth would be — not a disabled
 * pill and not an empty scope.
 */
export function useAvailableWeekScopes(userId: string | undefined) {
  const { index, ready } = useViewerHandicapIndex(userId);
  const { clubId, ready: clubReady } = useViewerHomeClubId(userId);

  /* ONE SOURCE, ONE TRUTH (§S2, option A): the availability count reads the SAME
     pool the lens filters — identical args to the board's worldwide read, so this
     shares its cache rather than issuing a second query. */
  const pool = useCircleLatestRounds(userId, {
    scope: 'everyone',
    windowDays: GOLF_WEEK_DAYS,
    limit: GOLF_WEEK_FETCH,
    oneRoundPerMember: false,
    courseIds: null,
  });

  const homeClubMembers = useMemo(() => {
    if (!clubId) return 0;
    const members = new Set<string>();
    for (const r of pool.data ?? []) if (r.player_club_id === clubId) members.add(r.user_id);
    return members.size;
  }, [pool.data, clubId]);

  const homeClubAvailable = homeClubMembers >= HOME_CLUB_MIN_MEMBERS;

  const scopes = useMemo(() => {
    let list = WEEK_SCOPES;
    if (index == null) list = list.filter((s) => s !== 'handicap_band');
    if (!homeClubAvailable) list = list.filter((s) => s !== 'home_club');
    return list;
  }, [index, homeClubAvailable]);

  return {
    scopes,
    viewerIndex: index,
    homeClubId: clubId,
    ready: ready && clubReady && !pool.isPending,
  };
}

/**
 * THE BAND FILTER (§S2). A PLAYER filter, so it cannot run through
 * useWeekScopeCourses — it is applied to the fetched rows instead.
 *
 * TWO DECISIONS RECORDED HERE ON PURPOSE (§S3.3):
 *   1. user_profiles.show_in_handicap_leaderboards IS DELIBERATELY NOT CONSULTED.
 *      Ben was told the opposite view and overruled it explicitly: a member who
 *      opts out of handicap LEADERBOARDS still appears in other members' bands.
 *      Its absence here is a decision, not an oversight.
 *   2. can_view_handicap() UPSTREAM is what actually governs whether a handicap
 *      is visible at all — it enforces user_profiles.handicap_visibility and
 *      requires an accepted friendship for anyone set to 'friends'. That gate is
 *      NOT overruled and is NOT worked around: when it withholds a handicap,
 *      hcp_at_time arrives null and the round simply does not qualify.
 *
 * hcp_at_time IS THE HANDICAP INDEX at the time of the round, not the
 * course-specific playing handicap (useCircleLatestRounds.ts:23-24) — which is
 * exactly the quantity this band compares. course_handicap is a different number
 * and is never substituted. A NULL hcp_at_time IS EXCLUDED (§S2.3): never
 * defaulted to the viewer's index, never treated as zero.
 */
export function filterToHandicapBand(
  rows: readonly CircleRoundRow[],
  viewerIndex: number | null,
): CircleRoundRow[] {
  if (viewerIndex == null) return [];
  return rows.filter((r) => {
    const played = r.hcp_at_time;
    if (played == null) return false;
    return Math.abs(Number(played) - viewerIndex) <= HANDICAP_BAND_STROKES;
  });
}

/** Every course id on an ACTIVE published Top 100 list. Cached for the session. */
export function useTop100CourseIds() {
  return useQuery({
    queryKey: ['courseled', 'top100-course-ids'],
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(is_active)')
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.course_id as string))];
    },
  });
}

/** Courses this member has played: rated rounds UNION tracked-but-unrated. */
export function usePlayedCourseIds(userId: string | undefined) {
  const journey = useUserJourneyCourses(userId);
  const { courses: playedUnrated, loading } = usePlayedUnratedCourses(userId);
  const ids = useMemo(() => {
    const s = new Set<string>();
    for (const c of journey.data?.played ?? []) if (c.id) s.add(c.id);
    for (const c of playedUnrated) if (c.course_id) s.add(c.course_id);
    return [...s];
  }, [journey.data, playedUnrated]);
  return { ids, ready: !journey.isPending && !loading };
}

/**
 * THE SCOPE'S COURSE ALLOW-LIST. `null` = no course predicate (Circle,
 * Suggested, Worldwide). `undefined` = not resolved yet, so the rounds query must
 * wait rather than run unfiltered and flash a wrong set.
 */
export function useWeekScopeCourses(userId: string | undefined, scope: WeekScope) {
  const top100 = useTop100CourseIds();
  const played = usePlayedCourseIds(userId);

  if (scope === 'top_100') {
    return { courseIds: top100.data ?? undefined, ready: !top100.isPending };
  }
  if (scope === 'played') {
    return { courseIds: played.ready ? played.ids : undefined, ready: played.ready };
  }
  return { courseIds: null as string[] | null, ready: true };
}

/**
 * THE ROUNDS FOR A SCOPE. GOLF_WEEK_DAYS (fourteen) in every case; the
 * per-member cap is off,
 * because a section that says "16 rounds" must show sixteen rounds (§S1.4).
 */
export function useGolfThisWeek(
  userId: string | undefined,
  scope: WeekScope = DEFAULT_WEEK_SCOPE,
  courseIds: string[] | null | undefined = null,
) {
  /* THE BAND HAS NO SERVER SCOPE: it is a player filter over the everyone read,
     narrowed client-side below (§S4.2). */
  const hookScope = scope === 'circle' ? 'circle' : 'everyone';
  const query = useCircleLatestRounds(courseIds === undefined ? undefined : userId, {
    scope: hookScope,
    windowDays: GOLF_WEEK_DAYS,
    limit: GOLF_WEEK_FETCH,
    oneRoundPerMember: false,
    courseIds: courseIds ?? null,
  });

  /* THE FILTER LIVES HERE (§S4.2) so the rail and the see-all sheet band
     identically off one read. The band never widens itself when the result is
     thin (§S4.4) — an empty scope renders the ordinary empty sentence. */
  const { viewerIndex, homeClubId } = useAvailableWeekScopes(userId);
  const data = useMemo(() => {
    if (scope === 'handicap_band') return filterToHandicapBand(query.data ?? [], viewerIndex);
    if (scope === 'home_club') return filterToHomeClub(query.data ?? [], homeClubId);
    return query.data;
  }, [query.data, scope, viewerIndex, homeClubId]);

  return { ...query, data } as typeof query;
}

/**
 * THE ORDER (MICRO_BRIEF_ROUNDS_RAIL_ORDER_AND_HEADING §S1). Filtering happens
 * in SQL, so this only ORDERS: recency, newest first, then a single adjacency
 * pass so the same course never renders twice in a row.
 *
 * REMOVED, DELIBERATELY — do not reinstate:
 *   - own-round-first: the viewer already knows about their own rounds, so
 *     leading with them opened the rail with its least new information. The
 *     amber treatment on those cards stays wherever they land.
 *   - new-course-first: it competed with recency for no stated reason and
 *     between them the two made the order impossible to infer.
 * Both made the rail's dates jump and diverge from the see-all sheet's
 * strictly chronological order over the same data.
 */
export function orderForWeek(
  rows: readonly CircleRoundRow[],
  _playedIds: ReadonlySet<string>,
): CircleRoundRow[] {
  const byRecency = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(b.play_date).localeCompare(String(a.play_date));

  return spreadCourses([...rows].sort(byRecency));
}

/**
 * ONE PASS, NO RE-SORT: when a card's course matches the card before it, swap it
 * with the next card of a different course. Two Broadstone rounds side by side
 * repeat the same photograph, which is the exact fault this section replaced.
 */
function spreadCourses(rows: CircleRoundRow[]): CircleRoundRow[] {
  const out = [...rows];
  for (let i = 1; i < out.length; i += 1) {
    if (out[i].course_id == null || out[i].course_id !== out[i - 1].course_id) continue;
    for (let j = i + 1; j < out.length; j += 1) {
      if (out[j].course_id !== out[i - 1].course_id) {
        [out[i], out[j]] = [out[j], out[i]];
        break;
      }
    }
  }
  return out;
}

/** The header boast (§1): rounds AND courses, both computed, never hardcoded. */
export function useWeekCounts(rows: readonly CircleRoundRow[]) {
  return useMemo(() => {
    const courses = new Set<string>();
    for (const r of rows) courses.add(r.course_id ?? `name:${r.course_name ?? '?'}`);
    return { rounds: rows.length, courses: courses.size };
  }, [rows]);
}

/**
 * THE RELATIVE BAND (§1, move 2). A comparison always has a winner, so this is
 * never empty while anybody played: lowest to-par, ties broken by the lower
 * gross and then by recency. Rounds without a par are not comparable and are
 * skipped rather than guessed at.
 */
export interface WeekBest {
  row: CircleRoundRow;
  toPar: number;
}

export function bestOfWeek(rows: readonly CircleRoundRow[]): WeekBest | null {
  let best: WeekBest | null = null;
  for (const r of rows) {
    if (r.gross == null || r.course_par == null) continue;
    const toPar = r.gross - r.course_par;
    /* TIES GO TO THE MOST RECENT ROUND (BRIEF_GOLF_THIS_WEEK_BAND §2.5): lower
       to-par, then lower gross, then the later play_date — never first-seen,
       because the caller's array is scope-ordered rather than date-ordered. */
    const tie =
      !!best && toPar === best.toPar && (r.gross ?? 0) === (best.row.gross ?? 0);
    if (
      !best ||
      toPar < best.toPar ||
      (toPar === best.toPar && (r.gross ?? 0) < (best.row.gross ?? 0)) ||
      (tie &&
        String(r.play_date).localeCompare(String(best!.row.play_date)) > 0)
    ) {
      best = { row: r, toPar };
    }
  }
  return best;
}
