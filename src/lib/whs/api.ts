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
  WhsLastRoundDetail,
  WhsScoreHole,
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
  is_counter,
  course:whs_courses(name, country_name)
`;

export async function fetchLastRound(connectionId: string): Promise<WhsScore | null> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(SCORE_SELECT)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WhsScore) ?? null;
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

export async function fetchRecentRounds(connectionId: string): Promise<WhsScore[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(`
      id, play_date, adjusted_gross, stableford_points,
      handicap_differential, is_counter,
      course:whs_courses(name)
    `)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as unknown as WhsScore[]) ?? [];
}

/** All scores (used for achievements + course form). */
export async function fetchAllScores(connectionId: string): Promise<WhsScore[]> {
  const { data, error } = await supabase
    .from('whs_scores' as any)
    .select(SCORE_SELECT)
    .eq('connection_id', connectionId)
    .order('play_date', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data as unknown as WhsScore[]) ?? [];
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
  daysBack: number,
): Promise<HandicapPoint[]> {
  const since = new Date(Date.now() - daysBack * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('whs_handicap_snapshots' as any)
    .select('observed_at, handicap_index')
    .eq('connection_id', connectionId)
    .gte('observed_at', since)
    .order('observed_at', { ascending: true });
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

export async function fetchFriendsActivity(
  ownerUserId: string,
  limit: number = 20,
): Promise<WhsFriendMatch[]> {
  const { data, error } = await supabase
    .from('whs_friend_matches' as any)
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .not('last_round_played_at', 'is', null)
    .order('last_round_played_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as WhsFriendMatch[];
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
