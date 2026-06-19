import { supabase } from '@/integrations/supabase/client';
import type {
  WhsConnection,
  WhsHandicapTrend,
  WhsScore,
  WhsCounterScore,
  ConnectWhsResponse,
  SyncWhsResponse,
  
  WhsInviteStatus,
  CreateInviteResponse,
  HandicapPoint,
  CourseForm,
  WhsRoundDetail,
  WhsScoreWithIndex,
  WhsLastRound,
  WhsScoreHole,
  WhsFriendCourseBest,
  WhsFriendActivityWithImage,
  WhsFriendWindowRanking,
  
} from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWhsConnection(userId: string): Promise<WhsConnection | null> {
  const { data, error } = await supabase
    .from('whs_connections' as any)
    .select(
      'id, passport_id, membership_number, last_synced_at, last_sync_status, initial_sync_complete, created_at'
    )
    .eq('user_id', userId)
    .eq('provider', 'england_golf')
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WhsConnection) ?? null;
}

export async function fetchHandicapTrend(connectionId: string): Promise<WhsHandicapTrend> {
  // Source of truth: whs_handicap_snapshots (post-round, authoritative).
  // Fall back to whs_scores.handicap_index_at_time (pre-round) only when no
  // snapshot exists — true for users connected before the snapshot logic shipped.
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const thirtyDaysAgoDate = thirtyDaysAgoIso.slice(0, 10);

  const { count: roundCount } = await supabase
    .from('whs_scores' as any)
    .select('id', { count: 'exact', head: true })
    .eq('connection_id', connectionId);

  const totalRoundsInRecord = roundCount ?? 0;

  // ── current handicap ─────────────────────────────────────────────────
  const { data: latestSnap } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let current: number | null = latestSnap
    ? Number((latestSnap as any).handicap_index)
    : null;

  if (current === null) {
    const { data: latestScore } = await supabase
      .from('whs_scores' as any)
      .select('handicap_index_at_time')
      .eq('connection_id', connectionId)
      .not('handicap_index_at_time', 'is', null)
      .order('play_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    current = latestScore
      ? Number((latestScore as any).handicap_index_at_time)
      : null;
  }

  if (current === null) {
    return {
      current: null,
      delta: null,
      previousHandicap: null,
      totalRoundsInRecord,
      hasHistory: false,
    };
  }

  // ── 30-day-ago handicap ──────────────────────────────────────────────
  const { data: prevSnap } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index')
    .eq('connection_id', connectionId)
    .lte('observed_at', thirtyDaysAgoIso)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let previousHandicap: number | null = prevSnap
    ? Number((prevSnap as any).handicap_index)
    : null;

  if (previousHandicap === null) {
    const { data: prevScore } = await supabase
      .from('whs_scores' as any)
      .select('handicap_index_at_time')
      .eq('connection_id', connectionId)
      .not('handicap_index_at_time', 'is', null)
      .lte('play_date', thirtyDaysAgoDate)
      .order('play_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    previousHandicap = prevScore
      ? Number((prevScore as any).handicap_index_at_time)
      : null;
  }

  if (previousHandicap === null) {
    return {
      current,
      delta: null,
      previousHandicap: null,
      totalRoundsInRecord,
      hasHistory: false,
    };
  }

  return {
    current,
    delta: current - previousHandicap,
    previousHandicap,
    totalRoundsInRecord,
    hasHistory: true,
  };
}

const SCORE_SELECT = `
  id, play_date, adjusted_gross, stableford_points,
  handicap_differential, course_rating, slope_rating, marker_name,
  is_counter, handicap_index_at_time,
  course:whs_courses(name, country_name, country_code)
`;

export async function fetchLastRound(connectionId: string): Promise<WhsLastRound | null> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(SCORE_SELECT)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(2);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const rows = data as unknown as Array<WhsScore & { handicap_index_at_time: number | null }>;
  const latest = rows[0];
  const previous = rows[1] ?? null;

  // Post-round value for the most recent round = current snapshot.
  const { data: snap } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let handicap_delta: number | null = null;

  // PRIMARY: snapshot-based calc (correct semantics: post-round − pre-round).
  if (snap && latest.handicap_index_at_time !== null) {
    handicap_delta = Number(
      (Number((snap as any).handicap_index) - Number(latest.handicap_index_at_time)).toFixed(1)
    );
  }

  // FALLBACK: round-vs-round when snapshot is missing.
  // NOTE: this computes the delta caused by the PREVIOUS round (n-1), not the
  // latest round (n). When the snapshot table is populated, the primary path
  // above will compute the correct "impact of latest round" semantics.
  // This fallback exists to avoid showing "Your first round on record" to users
  // who have many rounds but whose snapshot table is empty due to a sync bug.
  if (
    handicap_delta === null &&
    previous &&
    latest.handicap_index_at_time !== null &&
    previous.handicap_index_at_time !== null
  ) {
    handicap_delta = Number(
      (Number(latest.handicap_index_at_time) - Number(previous.handicap_index_at_time)).toFixed(1)
    );
  }

  let course_thumbnail_image: string | null = null;
  if (latest.course?.name) {
    course_thumbnail_image = await lookupCourseThumbnail(latest.course.name, (latest.course as any)?.country_code ?? null);
  }

  return {
    ...latest,
    course_thumbnail_image,
    handicap_index_at_time: latest.handicap_index_at_time,
    handicap_delta,
  };
}

export async function fetchCounters(connectionId: string): Promise<WhsCounterScore[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(`id, play_date, adjusted_gross, handicap_differential, course:whs_courses(name)`)
    .eq('connection_id', connectionId)
    .eq('is_counter', true)
    .order('play_date', { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data as unknown as WhsCounterScore[]) ?? [];
}

/** All scores (used for achievements + course form + recent rounds). */
export async function fetchAllScores(connectionId: string): Promise<WhsScoreWithIndex[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(SCORE_SELECT)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(1000);
  if (error) throw error;

  type RawScore = Omit<WhsScoreWithIndex, 'course_thumbnail_image'>;
  const rawRows = (data as unknown as RawScore[]) ?? [];
  if (rawRows.length === 0) return [];

  // Build a map of name → country_code so each thumbnail lookup uses the right
  // country context. Multiple rounds at the same course will share one country_code;
  // if somehow a course name appears with two different country_codes, we use the first.
  const nameToCountryCode: Record<string, string | null> = {};
  for (const r of rawRows) {
    if (r.course?.name && !(r.course.name.toLowerCase() in nameToCountryCode)) {
      nameToCountryCode[r.course.name.toLowerCase()] = (r.course as any)?.country_code ?? null;
    }
  }

  const thumbsByName: Record<string, string | null> = {};
  await Promise.all(
    Object.keys(nameToCountryCode).map(async (nameLower) => {
      const originalName = rawRows.find(r => r.course?.name?.toLowerCase() === nameLower)?.course?.name;
      if (!originalName) {
        thumbsByName[nameLower] = null;
        return;
      }
      thumbsByName[nameLower] = await lookupCourseThumbnail(originalName, nameToCountryCode[nameLower]);
    }),
  );

  return rawRows.map((r) => ({
    ...r,
    course_thumbnail_image: r.course?.name
      ? thumbsByName[r.course.name.toLowerCase()] ?? null
      : null,
  }));
}

export async function callConnectWhs(membership_number: string, password: string): Promise<ConnectWhsResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/connect-whs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ membership_number, password }),
  });
  try {
    return (await res.json()) as ConnectWhsResponse;
  } catch {
    return { ok: false, error_code: 'internal_error', message: 'Unexpected response from server.' };
  }
}

export async function callSyncWhsOne(): Promise<SyncWhsResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-whs-one`, {
    method: 'POST',
    headers,
  });
  try {
    return (await res.json()) as SyncWhsResponse;
  } catch {
    return { ok: false, message: 'Unexpected response from server.' };
  }
}

// ─── Phase 6b additions ────────────────────────────────────────────────

export async function fetchHandicapHistory(
  connectionId: string,
  daysBack: number | 'all',
): Promise<HandicapPoint[]> {
  // Union snapshots with score-derived history.
  //
  // whs_handicap_snapshots only records explicit handicap-change events from
  // our daily sync, so a freshly-connected user has just 1 row — not enough
  // to draw a chart. whs_scores.handicap_index_at_time captures the user's
  // handicap at the time each round was played, giving us a dense historical
  // dataset going back to their first EG round.
  //
  // We union both sources and dedupe by date (snapshots take precedence over
  // score-derived points when both exist for the same day).

  const sinceIso =
    daysBack === 'all'
      ? null
      : new Date(Date.now() - daysBack * 86400_000).toISOString();

  // 1. Snapshots (precise events)
  let snapshotsQuery = supabase
    .from('whs_handicap_snapshots' as any)
    .select('observed_at, handicap_index')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: true });

  if (sinceIso) {
    snapshotsQuery = snapshotsQuery.gte('observed_at', sinceIso);
  }

  // 2. Score-derived points (handicap at time of each round)
  let scoresQuery = supabase
    .from('whs_scores' as any)
    .select('play_date, handicap_index_at_time')
    .eq('connection_id', connectionId)
    .not('handicap_index_at_time', 'is', null)
    .order('play_date', { ascending: true });

  if (sinceIso) {
    // play_date is a DATE column, so compare to YYYY-MM-DD
    scoresQuery = scoresQuery.gte('play_date', sinceIso.split('T')[0]);
  }

  const [snapsRes, scoresRes] = await Promise.all([
    snapshotsQuery,
    scoresQuery,
  ]);

  if (snapsRes.error) throw snapsRes.error;
  if (scoresRes.error) throw scoresRes.error;

  // Build a date-keyed map. Snapshots win where both exist for the same day.
  const dayMap = new Map<string, HandicapPoint>();

  // Add score-derived points first (lower priority)
  for (const row of (scoresRes.data as any[]) ?? []) {
    if (row.handicap_index_at_time == null || !row.play_date) continue;
    // Normalise to ISO with midnight UTC so the chart x-axis is consistent
    const dateKey = String(row.play_date).slice(0, 10);
    const observedAt = `${dateKey}T00:00:00Z`;
    dayMap.set(dateKey, {
      observed_at: observedAt,
      handicap_index: Number(row.handicap_index_at_time),
    });
  }

  // Overlay snapshots (higher priority — overwrite same-day entries)
  for (const row of (snapsRes.data as any[]) ?? []) {
    if (!row.observed_at) continue;
    const dateKey = String(row.observed_at).slice(0, 10);
    dayMap.set(dateKey, {
      observed_at: row.observed_at,
      handicap_index: Number(row.handicap_index),
    });
  }

  return Array.from(dayMap.values()).sort((a, b) =>
    a.observed_at.localeCompare(b.observed_at),
  );
}

export async function fetchFriendCourseBests(
  ownerUserId: string,
): Promise<WhsFriendCourseBest[]> {
  const { data: friends, error: friendsErr } = await supabase
    .from('whs_friend_matches' as any)
    .select('friend_connection_id')
    .eq('owner_user_id', ownerUserId)
    .not('friend_connection_id', 'is', null);

  if (friendsErr) throw friendsErr;
  const friendConnIds = ((friends as any[]) ?? [])
    .map((f) => f.friend_connection_id)
    .filter(Boolean);

  if (friendConnIds.length === 0) return [];

  const { data, error } = await supabase
    .from('whs_friend_course_bests' as any)
    .select('*')
    .in('friend_connection_id', friendConnIds);

  if (error) throw error;
  return (data as unknown as WhsFriendCourseBest[]) ?? [];
}

export async function fetchFriendsActivity(
  ownerUserId: string,
  limit: number = 20,
): Promise<WhsFriendActivityWithImage[]> {
  const { data: rows, error } = await supabase
    .from('whs_friend_matches' as any)
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .not('last_round_played_at', 'is', null)
    .order('last_round_played_at', { ascending: false });
  if (error) throw error;
  const friends = ((rows as any[]) ?? []);

  if (friends.length === 0) return [];

  // Hydrate clbhouz profile_photo_url for friends with a linked user_id.
  const friendUserIds = friends
    .map((f) => f.friend_user_id)
    .filter((id): id is string => !!id);
  const photoByUserId: Record<string, string | null> = {};
  if (friendUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles' as any)
      .select('id, profile_photo_url')
      .in('id', friendUserIds);
    for (const p of ((profiles as any[]) ?? [])) {
      photoByUserId[p.id] = p.profile_photo_url ?? null;
    }
  }

  // Identity for synced friends, keyed by connection_id (join key to whs_scores).
  const friendByConn: Record<string, any> = {};
  for (const f of friends) {
    if (f.friend_connection_id) friendByConn[f.friend_connection_id] = f;
  }
  const syncedConnIds = Object.keys(friendByConn);

  // Fetch ALL scores in the last 14 days for synced friends — row-source.
  const FORTNIGHT_DAYS = 14;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - FORTNIGHT_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let scoreRows: any[] = [];
  if (syncedConnIds.length > 0) {
    const { data: sRows, error: sErr } = await supabase
      .from('whs_scores' as any)
      .select(`
        id,
        connection_id,
        play_date,
        adjusted_gross,
        stableford_points,
        handicap_differential,
        is_counter,
        handicap_index_at_time,
        course_id,
        course:whs_courses(name)
      `)
      .in('connection_id', syncedConnIds)
      .gte('play_date', cutoffStr)
      .order('play_date', { ascending: false });
    if (sErr) throw sErr;
    scoreRows = (sRows as any[]) ?? [];
  }

  // Course thumbnails — collect names from both score rows and match rows.
  const courseNames = new Set<string>();
  scoreRows.forEach((s) => { if (s.course?.name) courseNames.add(s.course.name); });
  friends.forEach((f) => { if (f.last_round_course_name) courseNames.add(f.last_round_course_name); });

  const thumbsByName: Record<string, string | null> = {};
  await Promise.all(
    Array.from(courseNames).map(async (name) => {
      thumbsByName[name.toLowerCase()] = await lookupCourseThumbnail(name);
    }),
  );

  const bests = await fetchFriendCourseBests(ownerUserId);
  const bestKeyed = new Set(
    bests.map((b) => `${b.friend_connection_id}:${b.best_score_id}`),
  );

  // Reactions over every in-window score row (capped).
  const allScoreIds = scoreRows.map((s) => s.id).filter((id): id is string => !!id);

  let viewerReactedSet = new Set<string>();
  const reactionCounts: Record<string, number> = {};

  const REACTION_LOOKUP_CAP = 100;
  const boundedScoreIds = allScoreIds.slice(0, REACTION_LOOKUP_CAP);

  if (boundedScoreIds.length > 0) {
    try {
      const userResp = await supabase.auth.getUser();
      const viewerId = userResp.data.user?.id;
      if (viewerId) {
        const { data: vRows, error: vErr } = await supabase
          .from('whs_round_reactions' as any)
          .select('score_id')
          .eq('user_id', viewerId)
          .in('score_id', boundedScoreIds);
        if (!vErr) {
          viewerReactedSet = new Set(((vRows as any[]) ?? []).map((r) => r.score_id as string));
        } else {
          console.warn('[whs] viewer reactions lookup failed (non-fatal):', vErr);
        }
      }
    } catch (e) {
      console.warn('[whs] viewer reactions lookup threw (non-fatal):', e);
    }

    try {
      const { data: countRows, error: cErr } = await supabase
        .from('whs_round_reactions' as any)
        .select('score_id')
        .in('score_id', boundedScoreIds);
      if (!cErr) {
        for (const row of ((countRows as any[]) ?? [])) {
          const sid = row.score_id as string;
          reactionCounts[sid] = (reactionCounts[sid] ?? 0) + 1;
        }
      } else {
        console.warn('[whs] reaction counts lookup failed (non-fatal):', cErr);
      }
    } catch (e) {
      console.warn('[whs] reaction counts lookup threw (non-fatal):', e);
    }
  }

  const items: WhsFriendActivityWithImage[] = [];

  // (A) Synced friends — one card PER score row.
  for (const s of scoreRows) {
    const f = friendByConn[s.connection_id];
    if (!f) continue;
    const courseNameKey = (s.course?.name ?? '').toLowerCase();
    items.push({
      friend_row_id: f.friend_row_id,
      friend_passport_id: f.friend_passport_id,
      friend_name: f.friend_name,
      friend_thumbnail_url: f.friend_thumbnail_url,
      friend_profile_photo_url: f.friend_user_id ? photoByUserId[f.friend_user_id] ?? null : null,
      friend_user_id: f.friend_user_id,
      friend_connection_id: f.friend_connection_id,
      is_clbhouz_user: !!f.is_clbhouz_user,
      last_round_played_at: s.play_date,
      last_round_course_name: s.course?.name ?? f.last_round_course_name,
      last_round_adjusted_gross: s.adjusted_gross,
      last_round_stableford: s.stableford_points ?? null,
      last_round_differential: s.handicap_differential ?? null,
      last_round_score_id: s.id,
      course_thumbnail_image:
        thumbsByName[courseNameKey] ??
        thumbsByName[(f.last_round_course_name ?? '').toLowerCase()] ??
        null,
      is_course_best: bestKeyed.has(`${f.friend_connection_id}:${s.id}`),
      friend_handicap_index: f.friend_handicap_index ?? null,
      is_counter: !!s.is_counter,
      handicap_index_at_time: s.handicap_index_at_time ?? null,
      viewer_has_reacted: viewerReactedSet.has(s.id),
      reaction_count: reactionCounts[s.id] ?? 0,
    });
  }

  // (B) Non-Clbhouz friends — one card from the match row.
  for (const f of friends) {
    if (f.friend_connection_id) continue;
    const courseNameKey = (f.last_round_course_name ?? '').toLowerCase();
    items.push({
      friend_row_id: f.friend_row_id,
      friend_passport_id: f.friend_passport_id,
      friend_name: f.friend_name,
      friend_thumbnail_url: f.friend_thumbnail_url,
      friend_profile_photo_url: null,
      friend_user_id: null,
      friend_connection_id: null,
      is_clbhouz_user: false,
      last_round_played_at: f.last_round_played_at,
      last_round_course_name: f.last_round_course_name,
      last_round_adjusted_gross: f.last_round_adjusted_gross,
      last_round_stableford: null,
      last_round_differential: null,
      last_round_score_id: null,
      course_thumbnail_image: thumbsByName[courseNameKey] ?? null,
      is_course_best: false,
      friend_handicap_index: f.friend_handicap_index ?? null,
      is_counter: false,
      handicap_index_at_time: null,
      viewer_has_reacted: false,
      reaction_count: 0,
    });
  }

  items.sort((a, b) => {
    const da = a.last_round_played_at ?? '';
    const db = b.last_round_played_at ?? '';
    return db.localeCompare(da);
  });

  return items.slice(0, limit);
}

export async function fetchSentInvites(): Promise<WhsInviteStatus[]> {
  const { data, error } = await supabase
    .from('whs_invite_status' as any)
    .select('*')
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as WhsInviteStatus[];
}

export async function callCreateInvite(
  invitee_passport_id: number,
  share_method?: string,
): Promise<CreateInviteResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-whs-invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ invitee_passport_id, share_method }),
  });
  try {
    return (await res.json()) as CreateInviteResponse;
  } catch {
    return { ok: false, error_code: 'internal_error', message: 'Unexpected response' };
  }
}

export async function fetchCourseForm(
  connectionId: string,
  currentHandicap: number,
  minRounds: number = 3,
): Promise<CourseForm[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select('handicap_differential, course:whs_courses(id, name)')
    .eq('connection_id', connectionId)
    .not('handicap_differential', 'is', null);
  if (error) throw error;

  const grouped = new Map<string, { name: string; diffs: number[] }>();
  for (const row of ((data as any[]) ?? [])) {
    const courseId = row.course?.id;
    const courseName = row.course?.name;
    const diff = Number(row.handicap_differential);
    if (!courseId || !courseName || isNaN(diff)) continue;
    const existing = grouped.get(courseId) ?? { name: courseName, diffs: [] };
    existing.diffs.push(diff);
    grouped.set(courseId, existing);
  }

  // First pass: build the base CourseForm rows including best/worst diffs.
  const baseRows: Omit<CourseForm, 'course_thumbnail_image' | 'course_region'>[] = [];
  for (const [course_id, info] of grouped) {
    if (info.diffs.length < minRounds) continue;
    const avg = info.diffs.reduce((a, b) => a + b, 0) / info.diffs.length;
    const best = Math.min(...info.diffs);
    const worst = Math.max(...info.diffs);
    baseRows.push({
      course_id,
      course_name: info.name,
      rounds_played: info.diffs.length,
      avg_differential: avg,
      expected_differential: currentHandicap,
      delta: avg - currentHandicap,
      best_differential: best,
      worst_differential: worst,
    });
  }

  // Second pass: enrich with course thumbnail + region in a single matcher hit.
  const uniqueNames = Array.from(new Set(baseRows.map((r) => r.course_name)));
  const metaByName: Record<string, { thumbnail_image: string | null; region: string | null } | null> = {};
  await Promise.all(
    uniqueNames.map(async (name) => {
      metaByName[name.toLowerCase()] = await lookupCourseMetaV2(name);
    }),
  );

  const result: CourseForm[] = baseRows.map((r) => ({
    ...r,
    course_thumbnail_image: metaByName[r.course_name.toLowerCase()]?.thumbnail_image ?? null,
    course_region: metaByName[r.course_name.toLowerCase()]?.region ?? null,
  }));
  return result.sort((a, b) => a.delta - b.delta);
}

// ─── Round detail (any score by id) ───────────────────────────────────
export async function fetchRoundDetail(
  scoreId: string,
): Promise<WhsRoundDetail | null> {
  const { data: round, error: roundErr } = await supabase
    .from('whs_scores' as any)
    .select(`
      id,
      play_date,
      adjusted_gross,
      actual_gross,
      stableford_points,
      handicap_differential,
      handicap_index_at_time,
      course_handicap,
      course_rating,
      slope_rating,
      pcc,
      marker_name,
      is_counter,
      is_competition_score,
      is_nine_hole,
      total_holes,
      hole_by_hole_fetched,
      permalink_url,
      course:whs_courses(name, country_name, country_code)
    `)
    .eq('id', scoreId)
    .maybeSingle();

  if (roundErr) throw roundErr;
  if (!round) return null;

  const r = round as any;

  // Course image join — robust name normalization
  let courseHeaderImage: string | null = null;
  let courseThumbnailImage: string | null = null;
  if (r.course?.name) {
    courseThumbnailImage = await lookupCourseThumbnail(r.course.name, r.course?.country_code ?? null);
    courseHeaderImage = courseThumbnailImage;
  }

  let holes: WhsScoreHole[] | null = null;
  if (r.hole_by_hole_fetched) {
    const { data: holeRows, error: holesErr } = await supabase
      .from('whs_score_holes' as any)
      .select(`
        hole_no,
        par,
        actual_gross,
        adjusted_gross,
        distance_yards,
        stroke_index,
        played,
        hole_alias
      `)
      .eq('score_id', r.id)
      .order('hole_no', { ascending: true });

    if (holesErr) throw holesErr;
    holes = (holeRows as any[] | null) ?? [];
    if (holes.length === 0) holes = null;
  }

  return {
    id: r.id,
    play_date: r.play_date,
    adjusted_gross: r.adjusted_gross,
    actual_gross: r.actual_gross,
    stableford_points: r.stableford_points,
    handicap_differential: r.handicap_differential,
    handicap_index_at_time: r.handicap_index_at_time,
    course_handicap: r.course_handicap,
    course_rating: r.course_rating,
    slope_rating: r.slope_rating,
    pcc: r.pcc,
    marker_name: r.marker_name,
    is_counter: r.is_counter,
    is_competition_score: r.is_competition_score,
    is_nine_hole: r.is_nine_hole,
    total_holes: r.total_holes,
    hole_by_hole_fetched: r.hole_by_hole_fetched,
    permalink_url: r.permalink_url,
    course: r.course,
    course_header_image: courseHeaderImage,
    course_thumbnail_image: courseThumbnailImage,
    holes,
  };
}

// ─── Friend round detail (Phase 1.6) ──────────────────────────────────
export async function fetchFriendRoundDetail(
  scoreId: string,
): Promise<{
  hole_by_hole_fetched: boolean;
  is_nine_hole: boolean;
  slope_rating: number | null;
  course_rating: number | null;
  holes: WhsScoreHole[];
} | null> {
  const { data: score, error } = await supabase
    .from('whs_scores' as any)
    .select('id, hole_by_hole_fetched, is_nine_hole, slope_rating, course_rating')
    .eq('id', scoreId)
    .maybeSingle();
  if (error) throw error;
  if (!score) return null;
  const s = score as any;

  if (!s.hole_by_hole_fetched) {
    return {
      hole_by_hole_fetched: false,
      is_nine_hole: !!s.is_nine_hole,
      slope_rating: s.slope_rating ?? null,
      course_rating: s.course_rating ?? null,
      holes: [],
    };
  }

  const { data: holes, error: holesErr } = await supabase
    .from('whs_score_holes' as any)
    .select(
      'hole_no, par, actual_gross, adjusted_gross, distance_yards, stroke_index, played, hole_alias',
    )
    .eq('score_id', s.id)
    .order('hole_no', { ascending: true });
  if (holesErr) throw holesErr;
  return {
    hole_by_hole_fetched: true,
    is_nine_hole: !!s.is_nine_hole,
    slope_rating: s.slope_rating ?? null,
    course_rating: s.course_rating ?? null,
    holes: ((holes as any[]) ?? []) as WhsScoreHole[],
  };
}

export async function fetchFriendWindowRankings(
  ownerUserId: string,
): Promise<WhsFriendWindowRanking[]> {
  const { data, error } = await supabase
    .from('whs_friend_window_rankings' as any)
    .select('*')
    .eq('owner_user_id', ownerUserId);
  if (error) throw error;
  return (data as unknown as WhsFriendWindowRanking[]) ?? [];
}

export async function callDisconnectWhs(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/disconnect-whs`, {
    method: 'POST',
    headers,
  });
  try { return await res.json(); } catch { return { ok: false, error: 'Unexpected response' }; }
}

export async function callDeleteWhsData(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-whs-data`, {
    method: 'POST',
    headers,
  });
  try { return await res.json(); } catch { return { ok: false, error: 'Unexpected response' }; }
}

/**
 * WHS course names sometimes differ from golf_courses canonical names.
 *  e.g. WHS:    "Sundridge Park-West Course"
 *       canon: "Sundridge Park (West Course)"
 * Try a few permutations before giving up.
 */
async function lookupCourseThumbnail(
  whsName: string,
  countryCode?: string | null,
): Promise<string | null> {
  const { lookupCourseThumbnailV2 } = await import('./courseNameMatcher');
  return lookupCourseThumbnailV2(whsName, countryCode);
}

async function lookupCourseMetaV2(
  whsName: string,
): Promise<{ thumbnail_image: string | null; region: string | null } | null> {
  const { lookupCourseMetaV2: impl } = await import('./courseNameMatcher');
  return impl(whsName);
}

// ─── Phase 0 (Friends Tab Redesign): Featured round + rivalries fetchers ──
import type {
  FriendFeaturedRoundHydrated,
  FriendRivalryHydrated,
  UserRivalOverride,
  FriendLeaderboardEntry,
} from './types';

export async function fetchFriendFeaturedRound(
  userId: string,
): Promise<FriendFeaturedRoundHydrated | null> {
  const { data: featured, error: featuredErr } = await supabase
    .from('friend_featured_round' as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (featuredErr) throw featuredErr;
  if (!featured) return null;

  const { data: score } = await supabase
    .from('whs_scores')
    .select(`
      id, play_date, adjusted_gross, handicap_differential, stableford_points,
      is_counter, handicap_index_at_time, course_id, connection_id,
      course:whs_courses(name)
    `)
    .eq('id', (featured as any).score_id)
    .maybeSingle();

  if (!score) return null;

  const { data: friendMatch } = await supabase
    .from('whs_friend_matches' as any)
    .select(
      'friend_name, friend_thumbnail_url, friend_handicap_index, friend_user_id, friend_connection_id, is_clbhouz_user, friend_passport_id, friend_home_club',
    )
    .eq('owner_user_id', userId)
    .eq('friend_connection_id', (score as any).connection_id)
    .maybeSingle();

  if (!friendMatch) return null;

  const courseName = (score as any).course?.name ?? null;
  let courseThumbnail: string | null = null;
  if (courseName) {
    const { data: gc } = await supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .eq('name', courseName)
      .maybeSingle();
    courseThumbnail = (gc as any)?.thumbnail_image ?? null;
  }

  return {
    ...(featured as any),
    friend_name: (friendMatch as any).friend_name,
    friend_thumbnail_url: (friendMatch as any).friend_thumbnail_url,
    friend_handicap_index: (friendMatch as any).friend_handicap_index,
    friend_user_id: (friendMatch as any).friend_user_id,
    friend_connection_id: (friendMatch as any).friend_connection_id,
    is_clbhouz_user: !!(friendMatch as any).is_clbhouz_user,
    friend_passport_id:
      (friendMatch as any).friend_passport_id != null
        ? Number((friendMatch as any).friend_passport_id)
        : null,
    friend_home_club: (friendMatch as any).friend_home_club ?? null,
    play_date: (score as any).play_date,
    course_id: (score as any).course_id,
    course_name: courseName,
    course_thumbnail_image: courseThumbnail,
    adjusted_gross: (score as any).adjusted_gross,
    handicap_differential: (score as any).handicap_differential,
    stableford_points: (score as any).stableford_points,
    is_counter: (score as any).is_counter,
    handicap_index_at_time: (score as any).handicap_index_at_time,
  } as FriendFeaturedRoundHydrated;
}

export async function fetchFriendRivalries(
  userId: string,
): Promise<FriendRivalryHydrated[]> {
  const { data: rivalries, error } = await supabase
    .from('friend_rivalry' as any)
    .select('*')
    .eq('user_id', userId)
    .order('slot_index', { ascending: true });

  if (error) throw error;
  const rows = (rivalries as any[]) ?? [];
  if (rows.length === 0) return [];

  const friendRowIds = rows.map((r) => r.rival_friend_row_id).filter(Boolean);

  const matchesByRowId: Record<string, any> = {};
  if (friendRowIds.length > 0) {
    const { data: matches } = await supabase
      .from('whs_friend_matches' as any)
      .select(
        'friend_row_id, friend_name, friend_thumbnail_url, friend_user_id, friend_connection_id, is_clbhouz_user',
      )
      .eq('owner_user_id', userId)
      .in('friend_row_id', friendRowIds);

    for (const m of (matches as any[]) ?? []) {
      matchesByRowId[m.friend_row_id] = m;
    }
  }

  // Pull clbhouz profile fields (header + avatar + mobile crop) for any rival
  // with a known user_id, either directly on the rivalry row or via the
  // friend match join. Rivals are always clbhouz-synced users.
  const rivalUserIds = Array.from(
    new Set(
      rows
        .map((r) => r.rival_user_id ?? matchesByRowId[r.rival_friend_row_id]?.friend_user_id)
        .filter(Boolean) as string[],
    ),
  );
  const profilesByUserId: Record<string, any> = {};
  if (rivalUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select(
        'id, header_photo_url, profile_photo_url, mobile_crop_x, mobile_crop_y, mobile_crop_width, mobile_crop_height',
      )
      .in('id', rivalUserIds);
    for (const p of (profiles as any[]) ?? []) {
      profilesByUserId[p.id] = p;
    }
  }

  return rows.map((r): FriendRivalryHydrated => {
    const match = r.rival_friend_row_id ? matchesByRowId[r.rival_friend_row_id] : null;
    const profileId = r.rival_user_id ?? match?.friend_user_id ?? null;
    const profile = profileId ? profilesByUserId[profileId] : null;
    return {
      ...r,
      rival_name: match?.friend_name ?? null,
      rival_thumbnail_url: match?.friend_thumbnail_url ?? null,
      rival_is_clbhouz_user: !!match?.is_clbhouz_user,
      rival_friend_connection_id: match?.friend_connection_id ?? null,
      rival_header_photo_url: profile?.header_photo_url ?? null,
      rival_profile_photo_url: profile?.profile_photo_url ?? null,
      rival_mobile_crop_x: profile?.mobile_crop_x ?? null,
      rival_mobile_crop_y: profile?.mobile_crop_y ?? null,
      rival_mobile_crop_width: profile?.mobile_crop_width ?? null,
      rival_mobile_crop_height: profile?.mobile_crop_height ?? null,
    };
  });
}

export async function fetchFriendLeaderboard(
  userId: string,
): Promise<FriendLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_friend_leaderboard' as any, {
    p_user_id: userId,
  });
  if (error) throw error;
  return ((data as any[]) ?? []).map((row): FriendLeaderboardEntry => ({
    is_self: !!row.is_self,
    friend_user_id: row.friend_user_id ?? null,
    friend_connection_id: row.friend_connection_id ?? null,
    friend_passport_id: row.friend_passport_id != null ? Number(row.friend_passport_id) : null,
    friend_row_id: row.friend_row_id ?? null,
    friend_name: row.friend_name ?? 'Unknown',
    friend_thumbnail_url: row.friend_thumbnail_url ?? null,
    friend_profile_photo_url: row.friend_profile_photo_url ?? null,
    friend_handicap_index: row.friend_handicap_index != null ? Number(row.friend_handicap_index) : null,
    friend_home_club: row.friend_home_club ?? null,
    last_round_played_at: row.last_round_played_at ?? null,
    last_round_course_name: row.last_round_course_name ?? null,
    is_clbhouz_user: !!row.is_clbhouz_user,
    handicap_30d_ago: row.handicap_30d_ago != null ? Number(row.handicap_30d_ago) : null,
    handicap_30d_delta: row.handicap_30d_delta != null ? Number(row.handicap_30d_delta) : null,
    rounds_last_30d: row.rounds_last_30d != null ? Number(row.rounds_last_30d) : 0,
  }));
}

export async function fetchUserRivalOverrides(
  userId: string,
): Promise<UserRivalOverride[]> {
  const { data, error } = await supabase
    .from('user_rival_overrides' as any)
    .select('*')
    .eq('user_id', userId)
    .order('slot_index');
  if (error) throw error;
  return ((data as any[]) ?? []) as UserRivalOverride[];
}

export async function upsertUserRivalOverride(
  userId: string,
  slotIndex: number,
  identifier: { rival_user_id?: string | null; rival_friend_row_id?: string | null },
): Promise<void> {
  const rivalUserId = identifier.rival_user_id ?? null;
  const rivalFriendRowId = rivalUserId ? null : (identifier.rival_friend_row_id ?? null);

  const { error } = await supabase
    .from('user_rival_overrides' as any)
    .upsert({
      user_id: userId,
      slot_index: slotIndex,
      rival_user_id: rivalUserId,
      rival_friend_row_id: rivalFriendRowId,
    });
  if (error) throw error;
}

export async function deleteUserRivalOverride(
  userId: string,
  slotIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from('user_rival_overrides' as any)
    .delete()
    .eq('user_id', userId)
    .eq('slot_index', slotIndex);
  if (error) throw error;
}

export interface RivalIdentity {
  rival_user_id?: string | null;
  rival_friend_row_id?: string | null;
}

export async function dismissRival(
  userId: string,
  identity: RivalIdentity,
): Promise<void> {
  const rivalUserId = identity.rival_user_id ?? null;
  const rivalFriendRowId = rivalUserId ? null : (identity.rival_friend_row_id ?? null);
  if (!rivalUserId && !rivalFriendRowId) return;
  // Idempotent: clear any prior dismissal for this identity before re-inserting.
  let del = supabase.from('user_rival_dismissals' as any).delete().eq('user_id', userId);
  del = rivalUserId
    ? del.eq('rival_user_id', rivalUserId)
    : del.eq('rival_friend_row_id', rivalFriendRowId);
  const { error: delErr } = await del;
  if (delErr) throw delErr;
  const { error } = await supabase
    .from('user_rival_dismissals' as any)
    .insert({
      user_id: userId,
      rival_user_id: rivalUserId,
      rival_friend_row_id: rivalFriendRowId,
    });
  if (error && (error as any).code !== '23505') throw error;
}

export async function clearRivalDismissal(
  userId: string,
  identity: RivalIdentity,
): Promise<void> {
  const rivalUserId = identity.rival_user_id ?? null;
  const rivalFriendRowId = rivalUserId ? null : (identity.rival_friend_row_id ?? null);
  if (!rivalUserId && !rivalFriendRowId) return;
  let q = supabase.from('user_rival_dismissals' as any).delete().eq('user_id', userId);
  q = rivalUserId
    ? q.eq('rival_user_id', rivalUserId)
    : q.eq('rival_friend_row_id', rivalFriendRowId);
  const { error } = await q;
  if (error) throw error;
}

// ───────────────────────────────────────────────────────────────────────
// Shared rounds (H2H) — used by FriendProfileSheet
// ───────────────────────────────────────────────────────────────────────

export interface SharedRoundResult {
  play_date: string;
  course_id: string;
  course_name: string;
  user_stableford: number;
  rival_stableford: number;
  user_gross: number;
  rival_gross: number;
  stableford_outcome: 'W' | 'L' | 'T';
  gross_outcome: 'W' | 'L' | 'T';
}

export interface SharedRoundsResult {
  shared_rounds_count: number;
  shared_rounds_last_90d: number;
  stableford_record: { wins: number; losses: number; ties: number };
  gross_record: { wins: number; losses: number; ties: number };
  shared_round_results: SharedRoundResult[];
}

const EMPTY_SHARED_ROUNDS: SharedRoundsResult = {
  shared_rounds_count: 0,
  shared_rounds_last_90d: 0,
  stableford_record: { wins: 0, losses: 0, ties: 0 },
  gross_record: { wins: 0, losses: 0, ties: 0 },
  shared_round_results: [],
};

/**
 * Fetch H2H shared rounds between the user and a target friend.
 * Returns empty result for non-Clbhouz friends (no whs_scores rows).
 */
export async function fetchSharedRounds(
  userId: string,
  rivalUserId: string | null,
): Promise<SharedRoundsResult> {
  if (!rivalUserId) return EMPTY_SHARED_ROUNDS;

  const { data, error } = await supabase.rpc('detect_shared_rounds' as any, {
    p_user_id: userId,
    p_rival_user_id: rivalUserId,
  });
  if (error) throw error;

  const rounds = ((data as any[]) ?? []) as SharedRoundResult[];
  const stableford = { wins: 0, losses: 0, ties: 0 };
  const gross = { wins: 0, losses: 0, ties: 0 };
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let recentCount = 0;

  for (const r of rounds) {
    if (r.stableford_outcome === 'W') stableford.wins++;
    else if (r.stableford_outcome === 'L') stableford.losses++;
    else stableford.ties++;
    if (r.gross_outcome === 'W') gross.wins++;
    else if (r.gross_outcome === 'L') gross.losses++;
    else gross.ties++;
    if (Date.parse(r.play_date) >= ninetyDaysAgo) recentCount++;
  }

  return {
    shared_rounds_count: rounds.length,
    shared_rounds_last_90d: recentCount,
    stableford_record: stableford,
    gross_record: gross,
    shared_round_results: rounds,
  };
}

// ─── Trophy aggregates RPC (Sprint 3) ─────────────────────────────────────
export interface TrophyAggregates {
  hole_stats: {
    aces_count: number;
    eagles_count: number;
    birdies_count: number;
    albatross_count: number;
    sub_par_rounds_count: number;
    rounds_with_holes_count: number;
    /** Aces in the windowed range. */
    aces_count_window: number;
    /** Albatross in the windowed range. */
    albatross_count_window: number;
    /** Eagles in the windowed range. */
    eagles_count_window: number;
    /** Birdies in the windowed range. */
    birdies_count_window: number;
    /** Rounds with hole-by-hole data in the windowed range. */
    rounds_with_holes_in_window: number;
    total_rounds_count: number;
    /** Lowest gross score across 18-hole rounds. 9-hole rounds excluded. */
    best_gross: number | null;
    /** Earliest play_date of an 18-hole round under 80 strokes. */
    first_sub_80_at: string | null;
    /** Earliest play_date of an 18-hole round under 90 strokes. */
    first_sub_90_at: string | null;
    /** Earliest play_date of an 18-hole round under 100 strokes. */
    first_sub_100_at: string | null;
    /** Earliest play_date of an 18-hole sub-par round. */
    first_sub_par_at: string | null;
    /** Holes played in window where (strokes - par) === 0. */
    pars_count: number;
    /** Holes played in window where (strokes - par) === 1. */
    bogey_count: number;
    /** Holes played in window where (strokes - par) >= 2 AND strokes > 1. */
    double_plus_count: number;
    /** Total holes played in window (from whs_score_holes WHERE played = true). */
    total_holes_in_window: number;
    /** Aces + albatross + eagles + birdies for the immediately-preceding
     *  window of same length. NULL for ALL scope. */
    birdies_or_better_prev_window: number | null;
  };
  course_stats: {
    countries_played: string[];
    /** Unique courses played across all WHS rounds. */
    unique_courses_count: number;
    /** Count of unique top-100 courses played, per list slug. */
    top100_lists: {
      global: number;
      usa: number;
      europe: number;
      'gb-i': number;
    };
    /** Total courses in each list (so we don't hardcode 100 on the frontend). */
    top100_list_sizes: {
      global: number;
      usa: number;
      europe: number;
      'gb-i': number;
    };
    /** Preserved for back-compat — not consumed by the new catalog. */
    best_top100_global_rank: number | null;
    best_top100_country_rank: number | null;
  };
  social_stats: {
    first_friend_at: string | null;
    first_round_with_friend_at: string | null;
    out_played_friend_first_at: string | null;
    rivalry_wins_count: number;
  };
}

export async function fetchTrophyAggregates(
  userId: string,
  connectionId: string,
  fromDate?: string | null,
  toDate?: string | null,
): Promise<TrophyAggregates | null> {
  const { data, error } = await supabase.rpc('get_trophy_aggregates' as any, {
    p_user_id: userId,
    p_connection_id: connectionId,
    p_from_date: fromDate ?? null,
    p_to_date: toDate ?? null,
  });
  if (error) {
    console.error('[fetchTrophyAggregates] failed:', error);
    return null;
  }
  return (data as unknown) as TrophyAggregates;
}


