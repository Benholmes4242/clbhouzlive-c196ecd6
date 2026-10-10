import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';

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
