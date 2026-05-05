import { supabase } from '@/integrations/supabase/client';
import type {
  WhsConnection,
  WhsHandicapTrend,
  WhsScore,
  WhsCounterScore,
  ConnectWhsResponse,
  SyncWhsResponse,
  WhsFriendMatch,
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
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WhsConnection) ?? null;
}

export async function fetchHandicapTrend(connectionId: string): Promise<WhsHandicapTrend> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const { data: latest } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index, observed_at')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: previous } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('handicap_index, observed_at')
    .eq('connection_id', connectionId)
    .lte('observed_at', thirtyDaysAgo)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const l = latest as any;
  const p = previous as any;
  if (!l) return { current: null, delta: null, hasHistory: false };
  if (!p) return { current: Number(l.handicap_index), delta: null, hasHistory: false };
  return {
    current: Number(l.handicap_index),
    delta: Number(l.handicap_index) - Number(p.handicap_index),
    hasHistory: true,
  };
}

const SCORE_SELECT = `
  id, play_date, adjusted_gross, stableford_points,
  handicap_differential, course_rating, slope_rating, marker_name,
  is_counter, handicap_index_at_time,
  course:whs_courses(name, country_name)
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

  let handicap_delta: number | null = null;
  if (
    previous &&
    latest.handicap_index_at_time !== null &&
    previous.handicap_index_at_time !== null
  ) {
    handicap_delta = Number(
      (latest.handicap_index_at_time - previous.handicap_index_at_time).toFixed(1)
    );
  }

  let course_thumbnail_image: string | null = null;
  if (latest.course?.name) {
    course_thumbnail_image = await lookupCourseThumbnail(latest.course.name);
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
  return (data as unknown as WhsScoreWithIndex[]) ?? [];
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
  let query = supabase
    .from('whs_handicap_snapshots' as any)
    .select('observed_at, handicap_index')
    .eq('connection_id', connectionId)
    .order('observed_at', { ascending: true });

  if (daysBack !== 'all') {
    const since = new Date(Date.now() - daysBack * 86400_000).toISOString();
    query = query.gte('observed_at', since);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    observed_at: d.observed_at,
    handicap_index: Number(d.handicap_index),
  }));
}

export async function fetchFriendsLeaderboard(ownerUserId: string): Promise<WhsFriendMatch[]> {
  const { data, error } = await supabase
    .from('whs_friend_matches' as any)
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('friend_handicap_index', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as WhsFriendMatch[];
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
    .order('last_round_played_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const friends = ((rows as any[]) ?? []);

  if (friends.length === 0) return [];

  const friendConnIds = friends
    .map((f) => f.friend_connection_id)
    .filter(Boolean);
  const scoresByConn: Record<string, any> = {};
  if (friendConnIds.length > 0) {
    const { data: scoreRows } = await supabase
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
      .in('connection_id', friendConnIds)
      .order('play_date', { ascending: false });
    for (const s of ((scoreRows as any[]) ?? [])) {
      if (!scoresByConn[s.connection_id]) {
        scoresByConn[s.connection_id] = s;
      }
    }
  }

  const courseNames = new Set<string>();
  Object.values(scoresByConn).forEach((s: any) => {
    if (s.course?.name) courseNames.add(s.course.name);
  });
  // Also include course names from friend match rows so non-Clbhouz friends
  // (no joined score) still get a course thumbnail.
  friends.forEach((f: any) => {
    if (f.last_round_course_name) courseNames.add(f.last_round_course_name);
  });
  const thumbsByName: Record<string, string | null> = {};
  // Use the same lookup as the Overview's LastRoundCard, which handles WHS
  // name variants (e.g. "Sundridge Park-East Course" → "Sundridge Park (East Course)").
  await Promise.all(
    Array.from(courseNames).map(async (name) => {
      thumbsByName[name.toLowerCase()] = await lookupCourseThumbnail(name);
    }),
  );

  const bests = await fetchFriendCourseBests(ownerUserId);
  const bestKeyed = new Set(
    bests.map((b) => `${b.friend_connection_id}:${b.best_score_id}`),
  );

  return friends.map((f): WhsFriendActivityWithImage => {
    const score = scoresByConn[f.friend_connection_id];
    const courseNameKey = (f.last_round_course_name ?? '').toLowerCase();
    const scoreCourseKey = (score?.course?.name ?? '').toLowerCase();
    return {
      friend_row_id: f.friend_row_id,
      friend_passport_id: f.friend_passport_id,
      friend_name: f.friend_name,
      friend_thumbnail_url: f.friend_thumbnail_url,
      friend_user_id: f.friend_user_id,
      friend_connection_id: f.friend_connection_id,
      is_clbhouz_user: !!f.is_clbhouz_user,
      last_round_played_at: f.last_round_played_at,
      last_round_course_name: f.last_round_course_name,
      last_round_adjusted_gross: f.last_round_adjusted_gross,
      last_round_stableford: score?.stableford_points ?? null,
      last_round_differential: score?.handicap_differential ?? null,
      last_round_score_id: score?.id ?? null,
      course_thumbnail_image:
        thumbsByName[courseNameKey] ?? thumbsByName[scoreCourseKey] ?? null,
      is_course_best: score
        ? bestKeyed.has(`${f.friend_connection_id}:${score.id}`)
        : false,
      friend_handicap_index: f.friend_handicap_index ?? null,
      is_counter: !!score?.is_counter,
      handicap_index_at_time: score?.handicap_index_at_time ?? null,
    };
  });
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

  const result: CourseForm[] = [];
  for (const [course_id, info] of grouped) {
    if (info.diffs.length < minRounds) continue;
    const avg = info.diffs.reduce((a, b) => a + b, 0) / info.diffs.length;
    result.push({
      course_id,
      course_name: info.name,
      rounds_played: info.diffs.length,
      avg_differential: avg,
      expected_differential: currentHandicap,
      delta: avg - currentHandicap,
    });
  }
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
      course:whs_courses(name, country_name)
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
    courseThumbnailImage = await lookupCourseThumbnail(r.course.name);
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
  holes: WhsScoreHole[];
} | null> {
  const { data: score, error } = await supabase
    .from('whs_scores' as any)
    .select('id, hole_by_hole_fetched, is_nine_hole')
    .eq('id', scoreId)
    .maybeSingle();
  if (error) throw error;
  if (!score) return null;
  const s = score as any;

  if (!s.hole_by_hole_fetched) {
    return {
      hole_by_hole_fetched: false,
      is_nine_hole: !!s.is_nine_hole,
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
async function lookupCourseThumbnail(whsName: string): Promise<string | null> {
  const candidates = new Set<string>();
  const trimmed = whsName.trim();
  candidates.add(trimmed);

  // Convert "Foo-Bar Course" -> "Foo (Bar Course)" / "Foo (Bar)"
  const dashMatch = trimmed.match(/^(.+?)-(.+)$/);
  if (dashMatch) {
    const [, base, suffix] = dashMatch;
    candidates.add(`${base.trim()} (${suffix.trim()})`);
    const suffixNoCourse = suffix.replace(/\s*course\s*$/i, '').trim();
    if (suffixNoCourse) candidates.add(`${base.trim()} (${suffixNoCourse})`);
  }

  // Try exact ilike on each candidate
  for (const name of candidates) {
    const { data } = await supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .ilike('name', name)
      .maybeSingle();
    const thumb = (data as any)?.thumbnail_image;
    if (thumb) return thumb;
  }

  // Last resort: fuzzy match by base name + suffix substring
  if (dashMatch) {
    const [, base, suffix] = dashMatch;
    const suffixCore = suffix.replace(/\s*course\s*$/i, '').trim();
    const { data } = await supabase
      .from('golf_courses')
      .select('name, thumbnail_image')
      .ilike('name', `${base.trim()}%${suffixCore}%`)
      .limit(1);
    const thumb = (data as any[])?.[0]?.thumbnail_image;
    if (thumb) return thumb;
  }

  return null;
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
      'friend_name, friend_thumbnail_url, friend_handicap_index, friend_user_id, friend_connection_id, is_clbhouz_user',
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

  return rows.map((r): FriendRivalryHydrated => {
    const match = r.rival_friend_row_id ? matchesByRowId[r.rival_friend_row_id] : null;
    return {
      ...r,
      rival_name: match?.friend_name ?? null,
      rival_thumbnail_url: match?.friend_thumbnail_url ?? null,
      rival_is_clbhouz_user: !!match?.is_clbhouz_user,
      rival_friend_connection_id: match?.friend_connection_id ?? null,
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
    friend_name: row.friend_name ?? 'Unknown',
    friend_thumbnail_url: row.friend_thumbnail_url ?? null,
    friend_handicap_index: row.friend_handicap_index != null ? Number(row.friend_handicap_index) : null,
    friend_home_club: row.friend_home_club ?? null,
    last_round_played_at: row.last_round_played_at ?? null,
    last_round_course_name: row.last_round_course_name ?? null,
    is_clbhouz_user: !!row.is_clbhouz_user,
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
  identifier: { rival_user_id?: string; rival_friend_row_id?: string },
): Promise<void> {
  const { error } = await supabase
    .from('user_rival_overrides' as any)
    .upsert({
      user_id: userId,
      slot_index: slotIndex,
      rival_user_id: identifier.rival_user_id ?? null,
      rival_friend_row_id: identifier.rival_friend_row_id ?? null,
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
